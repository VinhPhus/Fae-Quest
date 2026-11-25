-- Run after supabase_security_upgrade.sql and supabase_admin_upgrade.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_complete_quest(
  p_quest_id text,
  p_focus_minutes int DEFAULT NULL,
  p_focus_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_now_ms bigint := floor(extract(epoch FROM now()) * 1000);
  v_focus boolean := p_focus_session_id IS NOT NULL;
  v_profile public.profiles%ROWTYPE;
  v_state jsonb;
  v_task jsonb;
  v_task_index int;
  v_task_date text;
  v_difficulty text;
  v_daily_count int;
  v_boss_count int;
  v_focus_count int;
  v_minutes int := 0;
  v_exp int := 0;
  v_coins int := 0;
  v_rank text;
  v_rank_bonus int := 0;
  v_already_completed boolean;
  v_reward_cap boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để nghiệm thu nhiệm vụ.';
  END IF;
  IF v_focus IS DISTINCT FROM (p_focus_minutes IS NOT NULL) OR
     (v_focus AND (p_focus_minutes NOT BETWEEN 1 AND 180 OR length(p_focus_session_id) NOT BETWEEN 1 AND 100)) THEN
    RAISE EXCEPTION 'InvalidFocusSession';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ProfileNotFound';
  END IF;
  IF v_profile.banned_until > now() THEN
    RAISE EXCEPTION 'AccountBanned: Tài khoản đang bị tạm khóa đến %.', v_profile.banned_until;
  END IF;

  SELECT state_json INTO v_state FROM public.user_states WHERE user_id = v_user_id FOR UPDATE;
  SELECT item, (ordinality - 1)::int INTO v_task, v_task_index
  FROM jsonb_array_elements(v_state->'tasks') WITH ORDINALITY AS tasks(item, ordinality)
  WHERE item->>'id' = p_quest_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QuestNotFound';
  END IF;

  v_task_date := CASE
    WHEN jsonb_typeof(v_task->'completedAt') = 'number' THEN
      ((to_timestamp((v_task->>'completedAt')::double precision / 1000) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::text
  END;
  v_already_completed :=
    (v_focus AND COALESCE(v_task->>'lastFocusSessionId' = p_focus_session_id, false)) OR
    (COALESCE(v_task->'completed' = 'true'::jsonb, false) AND COALESCE(v_task_date = v_today::text, true));
  v_daily_count := CASE WHEN v_profile.last_task_date = v_today THEN COALESCE(v_profile.daily_tasks_count, 0) ELSE 0 END;
  v_boss_count := CASE WHEN v_profile.last_task_date = v_today THEN COALESCE(v_profile.daily_boss_count, 0) ELSE 0 END;
  v_focus_count := COALESCE((v_state->>'focusSessionsCompleted')::int, 0);

  IF NOT v_already_completed THEN
    IF v_task->>'target_date' > v_today::text THEN
      RAISE EXCEPTION 'QuestScheduled: Nhiệm vụ này được lên lịch cho Ngày Mai. Chưa thể nghiệm thu trước hạn!';
    END IF;

    v_difficulty := lower(COALESCE(v_task->>'difficulty', 'medium'));
    IF v_difficulty = 'boss' AND v_boss_count >= 2 AND NOT v_focus AND v_daily_count < 20 THEN
      RAISE EXCEPTION 'DailyBossLimit: Đã đạt giới hạn 2 nhiệm vụ Trùm Cuối hôm nay!';
    END IF;
    v_reward_cap := v_daily_count >= 20 OR (v_difficulty = 'boss' AND v_boss_count >= 2);
    IF NOT v_reward_cap THEN
      -- Keep the reward amounts in sync with src/constants/categories.ts.
      CASE v_difficulty
        WHEN 'easy' THEN v_exp := 30; v_coins := 2;
        WHEN 'hard' THEN v_exp := 110; v_coins := 10;
        WHEN 'boss' THEN v_exp := 200; v_coins := 20;
        ELSE v_exp := 60; v_coins := 5;
      END CASE;

      IF v_profile.streak >= 3 THEN
        v_exp := round(v_exp * 1.2);
      END IF;
      IF v_focus AND NOT COALESCE(v_task->'focusRewardClaimed' = 'true'::jsonb AND v_task_date = v_today::text, false) THEN
        v_minutes := greatest(5, p_focus_minutes);
        v_exp := v_exp + v_minutes;
        v_coins := v_coins + greatest(1, floor(v_minutes * 0.4)::int);
      END IF;

      -- Match the rank thresholds and cumulative promotion coins in src/constants/ranks.ts.
      SELECT COALESCE(sum(bonus) FILTER (WHERE threshold > COALESCE(v_profile.exp, 0)), 0)::int,
             (array_agg(rank ORDER BY threshold DESC))[1]
        INTO v_rank_bonus, v_rank
      FROM (VALUES (0, 'dong', 0), (201, 'bac', 20), (501, 'vang', 35),
                   (1001, 'luc-bao', 50), (1801, 'cao-thu', 75), (3001, 'dai-cao-thu', 100),
                   (5001, 'thach-dau', 200)) AS ranks(threshold, rank, bonus)
      WHERE threshold <= COALESCE(v_profile.exp, 0) + v_exp;
    END IF;

    v_daily_count := v_daily_count + 1;
    v_boss_count := v_boss_count + (v_difficulty = 'boss')::int;
    v_focus_count := v_focus_count + v_focus::int;

    UPDATE public.profiles SET
      exp = COALESCE(exp, 0) + v_exp,
      coins = COALESCE(coins, 0) + v_coins + v_rank_bonus,
      rank_id = COALESCE(v_rank, rank_id),
      completed_tasks_count = COALESCE(completed_tasks_count, 0) + 1,
      daily_tasks_count = v_daily_count,
      daily_boss_count = v_boss_count,
      last_task_date = v_today,
      updated_at = now()
    WHERE id = v_user_id RETURNING * INTO v_profile;

    v_task := v_task || jsonb_build_object(
      'status', 'done', 'is_completed', true,
      'completed', true, 'completedAt', v_now_ms,
      'completed_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'completionDate', v_today::text,
      'rewardClaimed', NOT v_reward_cap, 'lastAwardedExp', v_exp,
      'lastAwardedCoins', v_coins, 'lastRankUpBonus', v_rank_bonus
    );
    IF v_focus THEN
      v_task := v_task || jsonb_build_object('focusRewardClaimed', NOT v_reward_cap, 'lastFocusSessionId', p_focus_session_id);
    END IF;

    UPDATE public.user_states SET
      state_json = jsonb_set(v_state, ARRAY['tasks', v_task_index::text], v_task) || jsonb_build_object(
        'exp', v_profile.exp, 'coins', v_profile.coins, 'completedTotal', v_profile.completed_tasks_count,
        'dailyCompletedCount', v_daily_count, 'dailyBossCompletedCount', v_boss_count,
        'lastActiveDate', v_today::text, 'focusSessionsCompleted', v_focus_count
      ),
      updated_at = now()
    WHERE user_id = v_user_id;

    PERFORM public.fn_record_activity_log(
      v_user_id, v_profile.username,
      CASE WHEN v_focus THEN 'FOCUS_COMPLETE' ELSE 'TASK_COMPLETE' END,
      COALESCE(v_task->>'category', 'Khác'), v_difficulty, v_exp, v_coins
    );
  END IF;

  RETURN jsonb_build_object(
    'task', v_task, 'already_completed', v_already_completed,
    'awarded_exp', v_exp, 'awarded_coins', v_coins, 'rank_bonus_coins', v_rank_bonus,
    'new_exp', v_profile.exp, 'new_coins', v_profile.coins,
    'completed_total', v_profile.completed_tasks_count, 'daily_completed_count', v_daily_count,
    'daily_boss_completed_count', v_boss_count, 'focus_sessions_completed', v_focus_count,
    'reward_cap', v_reward_cap
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_complete_quest(text, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_quest(text, int, text) TO authenticated;

-- A snapshot from a second tab can have been read before the quest RPC committed.
-- Keep the server's newer completion fields while accepting edits to the rest of the task.
CREATE OR REPLACE FUNCTION public.fn_preserve_quest_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_tasks jsonb;
  v_today text := ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::text;
BEGIN
  IF (NEW.state_json ? 'resetAt' AND NEW.state_json->>'resetAt' IS DISTINCT FROM OLD.state_json->>'resetAt') OR
     jsonb_typeof(NEW.state_json->'tasks') IS DISTINCT FROM 'array' OR
     jsonb_typeof(OLD.state_json->'tasks') IS DISTINCT FROM 'array' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(jsonb_agg(
    CASE WHEN previous.task->>'completionDate' = v_today AND previous.task->'completed' = 'true'::jsonb AND
              CASE WHEN jsonb_typeof(incoming.task->'completedAt') = 'number'
                THEN (incoming.task->>'completedAt')::numeric <= (previous.task->>'completedAt')::numeric
                ELSE true
              END
      THEN incoming.task || jsonb_build_object(
        'completed', true, 'completedAt', previous.task->'completedAt', 'completionDate', v_today,
        'rewardClaimed', previous.task->'rewardClaimed', 'focusRewardClaimed', previous.task->'focusRewardClaimed',
        'lastAwardedExp', previous.task->'lastAwardedExp', 'lastAwardedCoins', previous.task->'lastAwardedCoins',
        'lastRankUpBonus', previous.task->'lastRankUpBonus', 'lastFocusSessionId', previous.task->'lastFocusSessionId'
      )
      WHEN NOT (incoming.task ? 'lastFocusSessionId') AND previous.task ? 'lastFocusSessionId'
      THEN incoming.task || jsonb_build_object('lastFocusSessionId', previous.task->'lastFocusSessionId')
      ELSE incoming.task
    END ORDER BY incoming.ordinality
  ), '[]'::jsonb) INTO v_tasks
  FROM jsonb_array_elements(NEW.state_json->'tasks') WITH ORDINALITY AS incoming(task, ordinality)
  LEFT JOIN LATERAL (
    SELECT task FROM jsonb_array_elements(OLD.state_json->'tasks') AS previous_tasks(task)
    WHERE task->>'id' = incoming.task->>'id' LIMIT 1
  ) AS previous ON true;

  NEW.state_json := jsonb_set(NEW.state_json, '{tasks}', v_tasks) || jsonb_build_object(
    'focusSessionsCompleted', greatest(COALESCE((NEW.state_json->>'focusSessionsCompleted')::int, 0),
                                     COALESCE((OLD.state_json->>'focusSessionsCompleted')::int, 0))
  );
  IF COALESCE((NEW.state_json->>'completedTotal')::int, 0) < COALESCE((OLD.state_json->>'completedTotal')::int, 0) THEN
    NEW.state_json := NEW.state_json || jsonb_build_object(
      'completedTotal', OLD.state_json->'completedTotal', 'exp', OLD.state_json->'exp', 'coins', OLD.state_json->'coins'
    );
    IF COALESCE(NEW.state_json->>'lastActiveDate', '') <= COALESCE(OLD.state_json->>'lastActiveDate', '') THEN
      NEW.state_json := NEW.state_json || jsonb_build_object(
        'lastActiveDate', OLD.state_json->'lastActiveDate', 'dailyCompletedCount', OLD.state_json->'dailyCompletedCount',
        'dailyBossCompletedCount', OLD.state_json->'dailyBossCompletedCount'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preserve_quest_completion ON public.user_states;
CREATE TRIGGER preserve_quest_completion BEFORE UPDATE OF state_json ON public.user_states
FOR EACH ROW EXECUTE FUNCTION public.fn_preserve_quest_completion();

NOTIFY pgrst, 'reload schema';
COMMIT;
