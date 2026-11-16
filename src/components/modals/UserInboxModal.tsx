import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { UserMessage } from '../../types';
import {
  Mail,
  X,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Gift,
  Clock,
  ChevronDown,
  ChevronUp,
  Inbox,
  CheckCheck,
} from 'lucide-react';

export const UserInboxModal: React.FC = () => {
  const {
    isUserInboxOpen,
    setUserInboxOpen,
    userMessages,
    unreadMessagesCount,
    markMessageAsRead,
    markAllMessagesAsRead,
  } = useFaeQuestStore();

  const [activeTab, setActiveTab] = useState<'all' | 'warning' | 'notice' | 'gift'>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  if (!isUserInboxOpen) return null;

  const filteredMessages = userMessages.filter((msg) => {
    if (activeTab === 'all') return true;
    return msg.message_type === activeTab;
  });

  const getBadgeIcon = (type: UserMessage['message_type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'gift':
        return <Gift className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getBadgeText = (type: UserMessage['message_type']) => {
    switch (type) {
      case 'warning':
        return 'Cảnh Báo';
      case 'gift':
        return 'Quà Thưởng';
      default:
        return 'Thông Báo';
    }
  };

  const getBadgeColor = (type: UserMessage['message_type']) => {
    switch (type) {
      case 'warning':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'gift':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      default:
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#11212D] border border-[#253745] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner relative">
              <Mail className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border border-[#06141B] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                  Hộp Thư Thợ Săn
                </h2>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300">
                    {unreadMessagesCount} chưa đọc
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9BA8AB]">
                Thông điệp, cảnh báo kỷ luật và chỉ thị từ Ban Quản Trị
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadMessagesCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMessagesAsRead()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#253745] hover:bg-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] transition cursor-pointer border border-[#4A5C6A]"
                title="Đánh dấu tất cả thư là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setUserInboxOpen(false)}
              className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-[#253745] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'warning', label: 'Cảnh báo' },
              { id: 'notice', label: 'Thông báo' },
              { id: 'gift', label: 'Quà tặng' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#CCD0CF] text-[#06141B] shadow-sm'
                    : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadMessagesCount > 0 && (
            <button
              type="button"
              onClick={() => markAllMessagesAsRead()}
              className="sm:hidden text-xs text-[#9BA8AB] hover:text-white underline shrink-0 cursor-pointer"
            >
              Đã đọc hết
            </button>
          )}
        </div>

        {/* Messages List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 max-h-[60vh] no-scrollbar">
          {filteredMessages.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#9BA8AB]">
                <Inbox className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-[#9BA8AB]">
                Không có thư nào trong mục này
              </p>
              <span className="text-xs text-[#9BA8AB]/60">
                Mọi chỉ thị hoặc thông báo mới sẽ xuất hiện tại đây
              </span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isExpanded = expandedMessageId === msg.id;
              const formattedDate = new Date(msg.created_at).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl border transition duration-200 overflow-hidden ${
                    !msg.is_read
                      ? 'bg-[#06141B] border-[#4A5C6A] shadow-md'
                      : 'bg-[#06141B]/50 border-[#253745]/70 opacity-90'
                  }`}
                >
                  {/* Message Item Header */}
                  <div
                    onClick={() => {
                      if (!msg.is_read) {
                        markMessageAsRead(msg.id);
                      }
                      setExpandedMessageId(isExpanded ? null : msg.id);
                    }}
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#253745]/30 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Unread dot or icon */}
                      <div className="pt-0.5 shrink-0">
                        {!msg.is_read ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4A5C6A]/50 block" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeColor(
                              msg.message_type
                            )}`}
                          >
                            {getBadgeIcon(msg.message_type)}
                            <span>{getBadgeText(msg.message_type)}</span>
                          </span>
                          <span className="text-[11px] text-[#9BA8AB] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#4A5C6A]" />
                            <span>{formattedDate}</span>
                          </span>
                        </div>

                        <h4
                          className={`text-sm tracking-wide ${
                            !msg.is_read ? 'font-bold text-white' : 'font-medium text-[#CCD0CF]'
                          }`}
                        >
                          {msg.subject}
                        </h4>

                        {!isExpanded && (
                          <p className="text-xs text-[#9BA8AB] line-clamp-1">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 text-[#9BA8AB]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#253745]/60 bg-[#11212D]/40 space-y-3">
                      <p className="text-xs sm:text-sm text-[#CCD0CF] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#253745]/40 text-[11px] text-[#9BA8AB]">
                        <span>Hệ thống Live-Ops FaeQuest</span>
                        {!msg.is_read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markMessageAsRead(msg.id);
                            }}
                            className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đánh dấu đã đọc</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#253745] bg-[#06141B]/80 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setUserInboxOpen(false)}
            className="px-5 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-white text-xs font-bold transition cursor-pointer border border-[#4A5C6A]"
          >
            Đóng Hộp Thư
          </button>
        </div>
      </div>
    </div>
  );
};
