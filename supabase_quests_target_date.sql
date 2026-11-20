-- ========================================================
-- FAEQUEST RPG TODO - MIGRATION: ADD TARGET_DATE TO TASKS/QUESTS
-- ========================================================
-- Migration này bảo đảm mọi bảng nhiệm vụ (nếu được tách bảng độc lập)
-- hoặc trường dữ liệu nhiệm vụ đều lưu chuẩn cột target_date dạng DATE (YYYY-MM-DD).

-- 1. Nếu hệ thống sử dụng bảng public.tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'target_date') THEN
      ALTER TABLE public.tasks ADD COLUMN target_date DATE DEFAULT CURRENT_DATE;
      CREATE INDEX IF NOT EXISTS idx_tasks_target_date ON public.tasks(target_date);
    END IF;
  END IF;
END $$;

-- 2. Nếu hệ thống sử dụng bảng public.quests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quests') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name = 'target_date') THEN
      ALTER TABLE public.quests ADD COLUMN target_date DATE DEFAULT CURRENT_DATE;
      CREATE INDEX IF NOT EXISTS idx_quests_target_date ON public.quests(target_date);
    END IF;
  END IF;
END $$;

-- 3. Hỗ trợ chuẩn hóa dữ liệu cũ trong public.user_states (nếu có state_json chứa mảng tasks)
-- Điền target_date mặc định là ngày hôm nay cho các task cũ chưa có trường target_date
UPDATE public.user_states
SET state_json = jsonb_set(
  state_json,
  '{tasks}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN task ? 'target_date' THEN task
        ELSE jsonb_set(task, '{target_date}', to_jsonb(to_char(CURRENT_DATE, 'YYYY-MM-DD')))
      END
    )
    FROM jsonb_array_elements(state_json->'tasks') AS task
  )
)
WHERE state_json ? 'tasks' 
  AND jsonb_typeof(state_json->'tasks') = 'array';
