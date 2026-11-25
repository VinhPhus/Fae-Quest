-- ========================================================
-- FAEQUEST RPG TODO - MIGRATION: ADD KANBAN STATUS TO QUESTS/TASKS
-- ========================================================
-- Bổ sung cột status ('todo' | 'in_progress' | 'done') và đồng bộ cứng is_completed

-- 1. Nếu hệ thống có bảng public.tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'status') THEN
      ALTER TABLE public.tasks ADD COLUMN status text DEFAULT 'todo';
    END IF;
    UPDATE public.tasks SET status = CASE WHEN COALESCE(is_completed, false) THEN 'done' ELSE 'todo' END WHERE status IS NULL;
  END IF;
END $$;

-- 2. Nếu hệ thống có bảng public.quests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quests') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'status') THEN
      ALTER TABLE public.quests ADD COLUMN status text DEFAULT 'todo';
    END IF;
    UPDATE public.quests SET status = CASE WHEN COALESCE(is_completed, false) THEN 'done' ELSE 'todo' END WHERE status IS NULL;
  END IF;
END $$;

-- 3. Chuẩn hóa dữ liệu nhiệm vụ hiện có trong public.user_states (JSONB state_json->'tasks')
UPDATE public.user_states
SET state_json = jsonb_set(
  state_json,
  '{tasks}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN (task ? 'status') AND (task ? 'is_completed') THEN task
        ELSE task || jsonb_build_object(
          'status', CASE WHEN COALESCE((task->>'completed')::boolean, false) OR COALESCE((task->>'is_completed')::boolean, false) THEN 'done' ELSE 'todo' END,
          'is_completed', COALESCE((task->>'completed')::boolean, false) OR COALESCE((task->>'is_completed')::boolean, false)
        )
      END
    )
    FROM jsonb_array_elements(state_json->'tasks') AS task
  )
)
WHERE state_json ? 'tasks'
  AND jsonb_typeof(state_json->'tasks') = 'array';
