import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { toast } from '../../store/useToastStore';
import { Task, TaskCategory, TaskDifficulty, TaskStatus } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import './QuestKanban.css';
import {
  Check,
  Trash2,
  Play,
  Repeat,
  Sparkles,
  Plus,
  Swords,
  Timer,
  Sunrise,
  Loader2,
  Pencil,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ColumnDef {
  id: TaskStatus;
  title: string;
  mobileTitle: string;
  dotColor: string;
  emptyText: string;
}

const KANBAN_COLUMNS: ColumnDef[] = [
  {
    id: 'todo',
    title: 'Chờ Thực Hiện',
    mobileTitle: 'Chờ làm',
    dotColor: '#94A3B8',
    emptyText: 'Chưa có lệnh nào chờ thực hiện',
  },
  {
    id: 'in_progress',
    title: 'Đang Rèn Luyện',
    mobileTitle: 'Đang làm',
    dotColor: '#F5B942',
    emptyText: 'Kéo thẻ hoặc bấm Bắt đầu / Focus',
  },
  {
    id: 'done',
    title: 'Đã Nghiệm Thu',
    mobileTitle: 'Đã xong',
    dotColor: '#10B981',
    emptyText: 'Kéo thẻ vào đây để nhận EXP & Xu',
  },
];

const SHORT_DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
  boss: 'Trùm',
};

const getEffectiveStatus = (task: Task): TaskStatus => {
  if (task.completed || task.is_completed || task.status === 'done') return 'done';
  if (task.status === 'in_progress') return 'in_progress';
  return 'todo';
};

interface DragState {
  task: Task;
  sourceStatus: TaskStatus;
  hoverStatus: TaskStatus;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  sourceRect: DOMRect;
  insertIndex: number;
}

interface LandingState {
  task: Task;
  left: number;
  top: number;
  width: number;
  targetStatus: TaskStatus;
}

export const QuestBentoGrid: React.FC = () => {
  const {
    tasks,
    activeCategoryFilter,
    setCategoryFilter,
    searchQuery,
    activeDayTab,
    setActiveDayTab,
    moveTaskStatus,
    deleteTask,
    setActivePomodoroTaskId,
    activeFocusTaskId,
    setCreateQuestOpen,
    setEditingTask,
    processingTaskIds,
    taskLocks,
  } = useFaeQuestStore();

  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [mobileColumnTab, setMobileColumnTab] = useState<TaskStatus>('todo');

  // Trạng thái hiệu ứng kéo-thả & hạ cánh
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [landingState, setLandingState] = useState<LandingState | null>(null);
  const [poppingCols, setPoppingCols] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    in_progress: false,
    done: false,
  });

  const colRefs = useRef<Record<TaskStatus, HTMLDivElement | null>>({
    todo: null,
    in_progress: null,
    done: null,
  });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  const todayStr = getTodayString();
  const isTomorrowTask = (t: Task) => Boolean(t.target_date && t.target_date > todayStr);

  const todayTasks = useMemo(() => tasks.filter((t) => !isTomorrowTask(t)), [tasks, todayStr]);
  const tomorrowTasks = useMemo(() => tasks.filter((t) => isTomorrowTask(t)), [tasks, todayStr]);

  const todayPendingCount = useMemo(
    () => todayTasks.filter((t) => getEffectiveStatus(t) !== 'done').length,
    [todayTasks]
  );
  const todayCompletedCount = useMemo(
    () => todayTasks.filter((t) => getEffectiveStatus(t) === 'done').length,
    [todayTasks]
  );
  const tomorrowPendingCount = useMemo(
    () => tomorrowTasks.filter((t) => getEffectiveStatus(t) !== 'done').length,
    [tomorrowTasks]
  );

  const currentDayTasks = activeDayTab === 'today' ? todayTasks : tomorrowTasks;

  // Áp dụng tìm kiếm + lọc Danh mục + lọc Độ khó đồng bộ trên cả 3 cột
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentDayTasks.filter((task) => {
      const matchSearch = !q || task.title.toLowerCase().includes(q);
      const matchCategory = activeCategoryFilter === 'all' || task.category === activeCategoryFilter;
      const matchDifficulty = difficultyFilter === 'all' || task.difficulty === difficultyFilter;
      return matchSearch && matchCategory && matchDifficulty;
    });
  }, [currentDayTasks, searchQuery, activeCategoryFilter, difficultyFilter]);

  const columnsMap = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    const sorted = [...filteredTasks].sort((a, b) => b.createdAt - a.createdAt);
    for (const t of sorted) {
      groups[getEffectiveStatus(t)].push(t);
    }
    return groups;
  }, [filteredTasks]);

  // Kích hoạt nảy số đếm đầu cột khi số lượng thay đổi
  const prevCountsRef = useRef<Record<TaskStatus, number>>({
    todo: columnsMap.todo.length,
    in_progress: columnsMap.in_progress.length,
    done: columnsMap.done.length,
  });

  useEffect(() => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const changed: TaskStatus[] = [];
    for (const s of statuses) {
      if (prevCountsRef.current[s] !== columnsMap[s].length) {
        changed.push(s);
        prevCountsRef.current[s] = columnsMap[s].length;
      }
    }
    if (changed.length > 0) {
      setPoppingCols((prev) => {
        const next = { ...prev };
        changed.forEach((c) => {
          next[c] = true;
        });
        return next;
      });
      const timer = setTimeout(() => {
        setPoppingCols((prev) => {
          const next = { ...prev };
          changed.forEach((c) => {
            next[c] = false;
          });
          return next;
        });
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [columnsMap.todo.length, columnsMap.in_progress.length, columnsMap.done.length]);

  // ================= POINTER DRAG & DROP CHO DESKTOP (>= 1024px) =================
  const computeColumnAndIndex = (
    clientX: number,
    clientY: number,
    draggedId: string,
    fallbackStatus: TaskStatus
  ): { hoverStatus: TaskStatus; insertIndex: number } => {
    let hoverStatus: TaskStatus = fallbackStatus;
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
    for (const st of statuses) {
      const colEl = colRefs.current[st];
      if (!colEl) continue;
      const rect = colEl.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        hoverStatus = st;
        break;
      }
    }

    const colTasks = columnsMap[hoverStatus].filter((t) => t.id !== draggedId);
    let insertIndex = colTasks.length;
    for (let i = 0; i < colTasks.length; i++) {
      const cardEl = cardRefs.current[colTasks[i].id];
      if (!cardEl) continue;
      const r = cardEl.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) {
        insertIndex = i;
        break;
      }
    }
    return { hoverStatus, insertIndex };
  };

  const handleCardPointerDown = (task: Task, e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;

    const sourceStatus = getEffectiveStatus(task);
    // Khóa thẻ ở cột Đã Nghiệm Thu khỏi thao tác kéo ngược
    if (sourceStatus === 'done') return;

    const cardEl = e.currentTarget;
    const cardRect = cardEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const offsetX = startX - cardRect.left;
    const offsetY = startY - cardRect.top;

    let draggingActivated = false;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      if (!draggingActivated) {
        if (Math.hypot(dx, dy) < 5) return;
        draggingActivated = true;
        document.body.classList.add('u255-grabbing');
      }

      const { hoverStatus, insertIndex } = computeColumnAndIndex(
        moveEvt.clientX,
        moveEvt.clientY,
        task.id,
        sourceStatus
      );

      setDragState({
        task,
        sourceStatus,
        hoverStatus,
        pointerX: moveEvt.clientX,
        pointerY: moveEvt.clientY,
        offsetX,
        offsetY,
        width: cardRect.width,
        height: cardRect.height,
        sourceRect: cardRect,
        insertIndex,
      });
    };

    const onPointerUp = async (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.body.classList.remove('u255-grabbing');

      if (!draggingActivated) return;

      const latest = dragStateRef.current;
      const targetStatus = latest ? latest.hoverStatus : sourceStatus;
      const releaseLeft = upEvt.clientX - offsetX;
      const releaseTop = upEvt.clientY - offsetY;
      const phRect = placeholderRef.current?.getBoundingClientRect();

      // Đặt thẻ ở tọa độ hiện tại rồi trượt hạ cánh mượt tới ô giữ chỗ
      setDragState(null);
      setLandingState({
        task,
        left: releaseLeft,
        top: releaseTop,
        width: cardRect.width,
        targetStatus,
      });

      const commitCoords = phRect
        ? { x: phRect.left + phRect.width * 0.5, y: phRect.top + 20 }
        : { x: upEvt.clientX, y: upEvt.clientY };

      requestAnimationFrame(() => {
        if (phRect) {
          setLandingState((prev) =>
            prev ? { ...prev, left: phRect.left, top: phRect.top } : null
          );
        }
      });

      let moveSucceeded = true;
      if (targetStatus !== sourceStatus) {
        moveSucceeded = await moveTaskStatus(task.id, targetStatus, commitCoords);
      }

      if (!moveSucceeded) {
        // Bật ngược thẻ mượt về vị trí cũ nếu bị Anti-Cheat từ chối
        setLandingState({
          task,
          left: phRect ? phRect.left : releaseLeft,
          top: phRect ? phRect.top : releaseTop,
          width: cardRect.width,
          targetStatus: sourceStatus,
        });
        requestAnimationFrame(() => {
          setLandingState((prev) =>
            prev
              ? {
                  ...prev,
                  left: cardRect.left,
                  top: cardRect.top,
                  targetStatus: sourceStatus,
                }
              : null
          );
        });
      }

      setTimeout(() => {
        setLandingState(null);
      }, 290);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // ================= ĐIỀU HƯỚNG BÀN PHÍM (ArrowLeft / ArrowRight) =================
  const handleCardKeyDown = async (task: Task, e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

    const currentStatus = getEffectiveStatus(task);
    if (currentStatus === 'done' && e.key === 'ArrowLeft') {
      e.preventDefault();
      toast.info('Lệnh đã được nghiệm thu', 'Không thể kéo ngược nhiệm vụ đã hoàn thành');
      return;
    }

    const order: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const idx = order.indexOf(currentStatus);
    const nextIdx = e.key === 'ArrowRight' ? Math.min(2, idx + 1) : Math.max(0, idx - 1);
    const targetStatus = order[nextIdx];
    if (targetStatus === currentStatus) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    await moveTaskStatus(task.id, targetStatus, { x: rect.right, y: rect.top });
  };

  // Render nội dung 1 thẻ nhiệm vụ Dark Fantasy
  const renderCardInner = (task: Task, status: TaskStatus) => {
    const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
    const cat = CATEGORIES[task.category] || CATEGORIES['ca-nhan'];
    const isTomorrow = isTomorrowTask(task);
    const isProcessing = Boolean(processingTaskIds?.includes(task.id));
    const isLocked = Boolean(taskLocks?.[task.id] && taskLocks[task.id] > Date.now());
    const isFocusingThis = activeFocusTaskId === task.id && status !== 'done';
    const isDone = status === 'done';

    return (
      <>
        {/* Dòng trên: Tiêu đề nhiệm vụ + nút Sửa / Xóa */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isFocusingThis && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-extrabold text-amber-300 animate-pulse">
                  <Timer className="w-2.5 h-2.5" />
                  <span>Đang Focus</span>
                </span>
              )}
              {isTomorrow && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                  <Sunrise className="w-2.5 h-2.5" />
                  <span>Ngày mai</span>
                </span>
              )}
              {task.isDailyRecurring && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#06141B] border border-white/10 text-[9px] font-bold text-[#9BA8AB]">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>Hằng ngày</span>
                </span>
              )}
            </div>

            <h4
              className={`text-sm font-bold leading-snug break-words ${
                isDone ? 'line-through text-[#9BA8AB]/65' : 'text-[#F4F0E8]'
              }`}
            >
              {task.title}
            </h4>
          </div>

          {/* Nút Sửa & Xóa gọn khi hover trên Desktop, vùng chạm thoải mái trên Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-1 shrink-0 opacity-95 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
              }}
              className="w-9 h-9 lg:w-7 lg:h-7 rounded-xl lg:rounded-lg bg-[#06141B]/80 hover:bg-white/10 border border-white/10 text-[#9BA8AB] hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Chỉnh sửa lệnh"
            >
              <Pencil className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              className="w-9 h-9 lg:w-7 lg:h-7 rounded-xl lg:rounded-lg bg-[#06141B]/80 hover:bg-rose-950/70 border border-white/10 hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 flex items-center justify-center transition cursor-pointer"
              title="Xóa nhiệm vụ"
            >
              <Trash2 className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
            </button>
          </div>
        </div>

        {/* Mô tả ngắn nếu có */}
        {task.description && (
          <p className="text-xs text-[#9BA8AB]/80 line-clamp-1 mt-1">{task.description}</p>
        )}

        {/* Dòng giữa: Tag Danh mục (5 màu Lục Giác) + Nhãn Độ khó + Thưởng EXP/Xu */}
        <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
              {cat.label}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${diff.badgeClass}`}>
              {SHORT_DIFFICULTY_LABELS[task.difficulty] || 'Vừa'}
            </span>
            {Boolean(task.focusDuration) && !isDone && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#06141B] border border-white/10 text-amber-300/90 inline-flex items-center gap-0.5">
                <Timer className="w-2.5 h-2.5" />
                <span>{task.focusDuration}p</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#06141B]/85 border border-white/10 text-[11px] font-extrabold shrink-0">
            <span className={isDone ? 'text-emerald-400/80' : 'text-[#CCD0CF]'}>
              +{task.lastAwardedExp ?? diff.exp} EXP
            </span>
            <span className="text-[#9BA8AB] flex items-center gap-0.5 font-bold">
              <span>• +{task.lastAwardedCoins ?? diff.coins}</span>
              <CoinIcon size="xs" />
            </span>
          </div>
        </div>

        {/* Dòng đáy: Thao tác 1 chạm / Nút Focus / Dấu tích xanh #10B981 */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10">
          {isDone ? (
            <>
              <span className="text-[11px] font-semibold text-emerald-300/75">
                Đã hoàn tất rèn luyện
              </span>
              <em title="Đã nghiệm thu thành công">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </em>
            </>
          ) : isTomorrow ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#06141B] border border-amber-500/30 text-[11px] font-bold text-amber-300/80 cursor-not-allowed">
              <Sunrise className="w-3 h-3" />
              <span>Mở khóa vào ngày mai</span>
            </div>
          ) : status === 'todo' ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void moveTaskStatus(task.id, 'in_progress');
                }}
                className="min-h-[40px] lg:min-h-[34px] px-3.5 lg:px-3 py-1.5 lg:py-1 rounded-full bg-white/5 hover:bg-amber-500/15 border border-white/12 hover:border-amber-400/50 text-xs font-bold text-[#CCD0CF] hover:text-amber-300 inline-flex items-center gap-1 transition cursor-pointer active:scale-95"
              >
                <span>Bắt đầu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePomodoroTaskId(task.id);
                }}
                className="min-h-[40px] lg:min-h-[34px] px-3.5 lg:px-3 py-1.5 lg:py-1 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs inline-flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                title={`Bắt đầu Focus (${task.focusDuration || 25} phút)`}
              >
                <Play className="w-3 h-3 fill-[#06141B]" />
                <span>Focus</span>
              </button>
            </>
          ) : (
            /* Cột in_progress */
            <>
              <button
                type="button"
                disabled={isProcessing || isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  void moveTaskStatus(task.id, 'done', { x: r.right + 8, y: r.top });
                }}
                className={`min-h-[40px] lg:min-h-[34px] px-3.5 lg:px-3 py-1.5 lg:py-1 rounded-full border font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                  isProcessing || isLocked
                    ? 'opacity-50 bg-[#06141B] border-white/10 text-[#9BA8AB] cursor-not-allowed'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/45 text-emerald-300 shadow-sm'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{isProcessing ? 'Đang xử lý...' : 'Nghiệm thu'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePomodoroTaskId(task.id);
                }}
                className={`min-h-[40px] lg:min-h-[34px] px-3.5 lg:px-3 py-1.5 lg:py-1 rounded-full font-extrabold text-xs inline-flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 ${
                  isFocusingThis
                    ? 'bg-amber-400 text-[#06141B]'
                    : 'bg-[#CCD0CF] hover:bg-white text-[#06141B]'
                }`}
                title={`Mở đồng hồ Focus (${task.focusDuration || 25} phút)`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isFocusingThis ? 'Mở Focus' : 'Focus'}</span>
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  // Render danh sách thẻ của 1 cột (hỗ trợ chèn khung giữ chỗ .u255-ph)
  const renderColumnList = (col: ColumnDef, enableDragOnDesktop: boolean) => {
    const colTasks = columnsMap[col.id];
    const isDraggingHere = Boolean(dragState && dragState.hoverStatus === col.id);
    const listWithoutDragged = dragState
      ? colTasks.filter((t) => t.id !== dragState.task.id)
      : colTasks;

    if (listWithoutDragged.length === 0 && !isDraggingHere) {
      return (
        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-white/10 bg-[#06141B]/40">
          <p className="text-xs text-[#9BA8AB]/70 font-medium">{col.emptyText}</p>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];

    listWithoutDragged.forEach((task, idx) => {
      if (isDraggingHere && dragState && dragState.insertIndex === idx) {
        elements.push(
          <div
            key="kanban-placeholder"
            ref={placeholderRef}
            className="u255-ph"
            style={{ height: `${dragState.height}px` }}
          />
        );
      }

      const isBeingLanded = Boolean(
        landingState && landingState.task.id === task.id && landingState.targetStatus === col.id
      );

      elements.push(
        <div
          key={task.id}
          ref={(el) => {
            cardRefs.current[task.id] = el;
          }}
          tabIndex={0}
          onKeyDown={(e) => void handleCardKeyDown(task, e)}
          onPointerDown={
            enableDragOnDesktop ? (e) => handleCardPointerDown(task, e) : undefined
          }
          onClick={() => {
            if (!dragState) setEditingTask(task);
          }}
          style={isBeingLanded ? { opacity: 0 } : undefined}
          className={`u255-cd group ${col.id !== 'done' ? 'is-draggable' : 'is-done'}`}
        >
          {renderCardInner(task, col.id)}
        </div>
      );
    });

    if (isDraggingHere && dragState && dragState.insertIndex >= listWithoutDragged.length) {
      elements.push(
        <div
          key="kanban-placeholder"
          ref={placeholderRef}
          className="u255-ph"
          style={{ height: `${dragState.height}px` }}
        />
      );
    }

    return <div className="space-y-2.5">{elements}</div>;
  };

  const categoryEntries = Object.values(CATEGORIES);

  return (
    <div id="tour-task-grid" className="space-y-4">
      {/* ================= 1. THANH CÔNG CỤ PHÍA TRÊN ================= */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Hàng trên: Tiêu đề + Chuyển ngày (Hôm nay / Ngày mai) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#10222E] border border-white/10 flex items-center justify-center text-[#CCD0CF] shadow-md shrink-0">
              {activeDayTab === 'today' ? (
                <Swords className="w-4 h-4 text-cyan-400" />
              ) : (
                <Sunrise className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-rpg font-extrabold text-base sm:text-xl text-[#F4F0E8] tracking-wide flex items-center gap-2">
                <span className="truncate">{activeDayTab === 'today' ? 'Bảng Lệnh Rèn Luyện' : 'Kế Hoạch Ngày Mai'}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#10222E] border border-white/10 text-[#CCD0CF] shrink-0">
                  {activeDayTab === 'today'
                    ? `${todayCompletedCount}/${todayTasks.length}`
                    : `${tomorrowTasks.length} lệnh`}
                </span>
              </h3>
            </div>
          </div>

          {/* Chuyển Ngày: Hôm nay vs Ngày mai (trải đều dễ chạm trên Mobile) */}
          <div className="grid grid-cols-2 sm:flex items-center p-1 rounded-full bg-[#06141B] border border-white/10 text-xs relative shadow-inner w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveDayTab('today')}
              className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer relative z-10 flex items-center justify-center gap-1.5 ${
                activeDayTab === 'today' ? 'text-[#F4F0E8]' : 'text-[#9BA8AB] hover:text-[#F4F0E8]'
              }`}
            >
              {activeDayTab === 'today' && (
                <motion.div
                  layoutId="activeDayTabIndicator"
                  className="absolute inset-0 rounded-full bg-[#162633] border border-white/15 shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>Hôm nay</span>
              {todayPendingCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-[#06141B] text-[#CCD0CF] border border-white/10">
                  {todayPendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveDayTab('tomorrow')}
              className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer relative z-10 flex items-center justify-center gap-1.5 ${
                activeDayTab === 'tomorrow'
                  ? 'text-[#F4F0E8]'
                  : 'text-[#9BA8AB] hover:text-[#F4F0E8]'
              }`}
            >
              {activeDayTab === 'tomorrow' && (
                <motion.div
                  layoutId="activeDayTabIndicator"
                  className="absolute inset-0 rounded-full bg-[#162633] border border-white/15 shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>Ngày mai</span>
              {tomorrowPendingCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tomorrowPendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hàng lọc theo Danh mục & Độ khó hoạt động đồng thời trên cả 3 cột */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#0B1922]/85 border border-white/10">
          {/* Lọc theo Danh mục */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <Filter className="w-3.5 h-3.5 text-[#9BA8AB] shrink-0 ml-1" />
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`min-h-[32px] sm:min-h-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer border ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#162633] text-[#F4F0E8] border-white/20'
                  : 'bg-transparent text-[#9BA8AB] hover:text-[#F4F0E8] border-transparent'
              }`}
            >
              Tất cả nhóm
            </button>
            {categoryEntries.map((cat) => {
              const selected = activeCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(selected ? 'all' : cat.id)}
                  className={`min-h-[32px] sm:min-h-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer border ${
                    selected
                      ? cat.badgeBg
                      : 'bg-transparent text-[#9BA8AB] hover:text-[#F4F0E8] border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Lọc theo Độ khó */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar border-t border-white/5 pt-1.5 sm:border-t-0 sm:pt-0">
            {[
              { id: 'all', label: 'Mọi độ khó' },
              { id: 'easy', label: 'Dễ' },
              { id: 'medium', label: 'Vừa' },
              { id: 'hard', label: 'Khó' },
              { id: 'boss', label: 'Trùm' },
            ].map((item) => {
              const active = difficultyFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficultyFilter(item.id)}
                  className={`min-h-[32px] sm:min-h-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition shrink-0 cursor-pointer border ${
                    active
                      ? 'bg-[#162633] text-amber-300 border-amber-400/35'
                      : 'bg-transparent text-[#9BA8AB] hover:text-[#F4F0E8] border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= 2. TRẠNG THÁI TRỐNG HOÀN TOÀN ================= */}
      {currentDayTasks.length === 0 ? (
        <div className="rounded-[24px] p-8 sm:p-10 bg-[#0B1922]/85 border border-white/10 text-center space-y-3.5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#10222E] border border-white/10 mx-auto flex items-center justify-center text-[#CCD0CF]">
            {activeDayTab === 'today' ? (
              <Sparkles className="w-7 h-7 text-cyan-300" />
            ) : (
              <Sunrise className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <h4 className="text-base font-extrabold text-[#F4F0E8]">
            {activeDayTab === 'today'
              ? 'Chưa có nhiệm vụ nào hôm nay'
              : 'Chưa có nhiệm vụ nào được lên lịch cho ngày mai'}
          </h4>
          <p className="text-xs text-[#9BA8AB] max-w-sm mx-auto">
            {activeDayTab === 'today'
              ? 'Hãy bắt đầu khắc lệnh nhiệm vụ mới để tích lũy EXP và thăng hạng Thợ Săn ngay hôm nay!'
              : 'Lên lịch trước các mục tiêu ngày mai để sẵn sàng bứt phá ngay khi thức dậy!'}
          </p>
          <button
            type="button"
            onClick={() => setCreateQuestOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{activeDayTab === 'today' ? 'Khắc Lệnh Đầu Tiên' : 'Lên Lịch Ngày Mai'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* ================= 3A. GIAO DIỆN MOBILE / TABLET (< 1024px): TAB 3 CỘT ================= */}
          <div className="lg:hidden space-y-3">
            {/* Thanh Tab 3 Cột Gọn Gàng (Không cắt chữ trên màn hình hẹp) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#0B1922]/90 border border-white/10">
              {KANBAN_COLUMNS.map((col) => {
                const count = columnsMap[col.id].length;
                const isSelected = mobileColumnTab === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setMobileColumnTab(col.id)}
                    className={`min-h-[44px] px-1.5 sm:px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-xs font-bold transition relative cursor-pointer ${
                      isSelected
                        ? 'text-[#F4F0E8]'
                        : 'text-[#9BA8AB] hover:text-[#F4F0E8]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="mobileKanbanColumnPill"
                        className="absolute inset-0 rounded-xl bg-[#162633] border border-white/15 shadow-sm z-0"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0 relative z-10"
                      style={{ backgroundColor: col.dotColor }}
                    />
                    <span className="sm:hidden text-[11px] whitespace-nowrap relative z-10">
                      {col.mobileTitle}
                    </span>
                    <span className="hidden sm:inline text-[11px] truncate relative z-10">
                      {col.title}
                    </span>
                    <span className="u255-ch relative z-10">
                      <b className={poppingCols[col.id] ? 'is-pop' : ''}>{count}</b>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách thẻ thuộc cột đang chọn trên Mobile (cuộn dọc mượt 100%) */}
            <div className="u255-col p-2.5 sm:p-3.5" data-status={mobileColumnTab}>
              {renderColumnList(
                KANBAN_COLUMNS.find((c) => c.id === mobileColumnTab) || KANBAN_COLUMNS[0],
                false
              )}
            </div>
          </div>

          {/* ================= 3B. GIAO DIỆN DESKTOP (>= 1024px): BẢNG KANBAN 3 CỘT ================= */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-4 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const count = columnsMap[col.id].length;
              const isOver = Boolean(dragState && dragState.hoverStatus === col.id);

              return (
                <div
                  key={col.id}
                  ref={(el) => {
                    colRefs.current[col.id] = el;
                  }}
                  data-status={col.id}
                  className={`u255-col flex flex-col p-3.5 ${isOver ? 'is-over' : ''}`}
                >
                  {/* Đầu cột: Chấm màu + Tên cột + Số đếm bật nảy */}
                  <div className="u255-ch pb-3 mb-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                        style={{
                          backgroundColor: col.dotColor,
                          boxShadow: `0 0 8px ${col.dotColor}88`,
                        }}
                      />
                      <span className="font-bold text-sm text-[#F4F0E8] truncate">{col.title}</span>
                    </div>
                    <b className={poppingCols[col.id] ? 'is-pop' : ''}>{count}</b>
                  </div>

                  {/* Khu vực thẻ cuộn độc lập mượt mà */}
                  <div className="max-h-[calc(100vh-300px)] min-h-[340px] overflow-y-auto pr-1 space-y-2.5 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {renderColumnList(col, true)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= 4. THẺ ĐANG NHẤC KÉO / ĐANG HẠ CÁNH (PORTAL) ================= */}
      {typeof document !== 'undefined' &&
        dragState &&
        createPortal(
          <div
            style={{
              left: `${dragState.pointerX - dragState.offsetX}px`,
              top: `${dragState.pointerY - dragState.offsetY}px`,
              width: `${dragState.width}px`,
            }}
            className="u255-cd is-lift"
          >
            {renderCardInner(dragState.task, dragState.sourceStatus)}
          </div>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        landingState &&
        createPortal(
          <div
            style={{
              left: `${landingState.left}px`,
              top: `${landingState.top}px`,
              width: `${landingState.width}px`,
            }}
            className={`u255-cd is-land ${landingState.targetStatus === 'done' ? 'is-done' : ''}`}
          >
            {renderCardInner(landingState.task, landingState.targetStatus)}
          </div>,
          document.body
        )}
    </div>
  );
};
