import { create } from 'zustand';

export type ToastKind = 'ok' | 'reward' | 'info' | 'wait' | 'err';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
  accent?: 'emerald' | 'gold' | 'sky' | 'healing' | 'amber' | 'rose';
}

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: ToastAction;
  accent?: ToastOptions['accent'];
  duration: number; // ms; Infinity for 'wait'
  remainingMs: number;
  lastResumedAt: number;
  timerVersion: number;
}

interface ToastStoreState {
  toasts: ToastItem[];
  isExpanded: boolean;
  add: (
    kind: ToastKind,
    title: string,
    description?: string,
    actionOrOpts?: ToastAction | ToastOptions
  ) => string;
  update: (
    id: string,
    patch: {
      kind?: ToastKind;
      title?: string;
      description?: string;
      action?: ToastAction;
      duration?: number;
      accent?: ToastOptions['accent'];
    }
  ) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  setExpanded: (expanded: boolean) => void;
}

const DEFAULT_DURATION = 4500;
const timerMap = new Map<string, ReturnType<typeof setTimeout>>();

function clearToastTimer(id: string) {
  const existing = timerMap.get(id);
  if (existing) {
    clearTimeout(existing);
    timerMap.delete(id);
  }
}

function isToastAction(obj: ToastAction | ToastOptions | undefined): obj is ToastAction {
  return Boolean(obj && 'label' in obj && 'onClick' in obj);
}

export const useToastStore = create<ToastStoreState>((set, get) => {
  const scheduleTimer = (id: string, delayMs: number) => {
    clearToastTimer(id);
    if (!Number.isFinite(delayMs) || delayMs <= 0) return;
    const handle = setTimeout(() => {
      timerMap.delete(id);
      get().dismiss(id);
    }, delayMs);
    timerMap.set(id, handle);
  };

  return {
    toasts: [],
    isExpanded: false,

    add: (kind, title, description, actionOrOpts) => {
      const id = `u070_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const action = isToastAction(actionOrOpts) ? actionOrOpts : actionOrOpts?.action;
      const customDuration = !isToastAction(actionOrOpts) ? actionOrOpts?.duration : undefined;
      const accent = !isToastAction(actionOrOpts) ? actionOrOpts?.accent : undefined;

      const duration =
        customDuration !== undefined
          ? customDuration
          : kind === 'wait'
            ? Infinity
            : DEFAULT_DURATION;

      const now = Date.now();
      const item: ToastItem = {
        id,
        kind,
        title,
        description,
        action,
        accent,
        duration,
        remainingMs: duration,
        lastResumedAt: now,
        timerVersion: 1,
      };

      const { isExpanded } = get();
      set((prev) => {
        const nextList = [item, ...prev.toasts];
        if (nextList.length > 10) {
          const dropped = nextList.slice(10);
          dropped.forEach((d) => clearToastTimer(d.id));
          return { toasts: nextList.slice(0, 10) };
        }
        return { toasts: nextList };
      });

      if (!isExpanded && Number.isFinite(duration)) {
        scheduleTimer(id, duration);
      }

      return id;
    },

    update: (id, patch) => {
      clearToastTimer(id);
      const now = Date.now();
      const { isExpanded } = get();

      let nextDurationToSchedule: number | null = null;

      set((prev) => ({
        toasts: prev.toasts.map((t) => {
          if (t.id !== id) return t;
          const nextKind = patch.kind ?? t.kind;
          const nextDuration =
            patch.duration !== undefined
              ? patch.duration
              : patch.kind && patch.kind !== 'wait' && !Number.isFinite(t.duration)
                ? DEFAULT_DURATION
                : patch.kind === 'wait'
                  ? Infinity
                  : t.duration;

          const updated: ToastItem = {
            ...t,
            kind: nextKind,
            title: patch.title ?? t.title,
            description: patch.description !== undefined ? patch.description : t.description,
            action: patch.action !== undefined ? patch.action : t.action,
            accent: patch.accent !== undefined ? patch.accent : t.accent,
            duration: nextDuration,
            remainingMs: nextDuration,
            lastResumedAt: now,
            timerVersion: t.timerVersion + 1,
          };

          if (Number.isFinite(nextDuration)) {
            nextDurationToSchedule = nextDuration;
          }
          return updated;
        }),
      }));

      if (!isExpanded && nextDurationToSchedule !== null) {
        scheduleTimer(id, nextDurationToSchedule);
      }
    },

    dismiss: (id) => {
      clearToastTimer(id);
      set((prev) => {
        const remaining = prev.toasts.filter((t) => t.id !== id);
        return {
          toasts: remaining,
          isExpanded: remaining.length < 2 ? false : prev.isExpanded,
        };
      });
    },

    clear: () => {
      timerMap.forEach((handle) => clearTimeout(handle));
      timerMap.clear();
      set({ toasts: [], isExpanded: false });
    },

    setExpanded: (expanded) => {
      const prevExpanded = get().isExpanded;
      if (prevExpanded === expanded) return;
      const now = Date.now();

      if (expanded) {
        // Tạm dừng đếm ngược của toàn bộ thẻ
        set((prev) => ({
          isExpanded: true,
          toasts: prev.toasts.map((t) => {
            clearToastTimer(t.id);
            if (!Number.isFinite(t.duration)) return t;
            const elapsed = Math.max(0, now - t.lastResumedAt);
            return {
              ...t,
              remainingMs: Math.max(150, t.remainingMs - elapsed),
            };
          }),
        }));
      } else {
        // Tiếp tục đếm ngược phần thời gian còn lại
        const updatedList = get().toasts.map((t) => {
          if (!Number.isFinite(t.duration)) return t;
          return {
            ...t,
            lastResumedAt: now,
          };
        });
        set({ isExpanded: false, toasts: updatedList });
        updatedList.forEach((t) => {
          if (Number.isFinite(t.remainingMs)) {
            scheduleTimer(t.id, t.remainingMs);
          }
        });
      }
    },
  };
});

export const toast = {
  ok: (title: string, description?: string, actionOrOpts?: ToastAction | ToastOptions) =>
    useToastStore.getState().add('ok', title, description, actionOrOpts),
  reward: (title: string, description?: string, actionOrOpts?: ToastAction | ToastOptions) =>
    useToastStore.getState().add('reward', title, description, actionOrOpts),
  info: (title: string, description?: string, actionOrOpts?: ToastAction | ToastOptions) =>
    useToastStore.getState().add('info', title, description, actionOrOpts),
  wait: (title: string, description?: string, actionOrOpts?: ToastAction | ToastOptions) =>
    useToastStore.getState().add('wait', title, description, actionOrOpts),
  err: (title: string, description?: string, actionOrOpts?: ToastAction | ToastOptions) =>
    useToastStore.getState().add('err', title, description, actionOrOpts),
  update: (
    id: string,
    patch: Parameters<ToastStoreState['update']>[1]
  ) => useToastStore.getState().update(id, patch),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
