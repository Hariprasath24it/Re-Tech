import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';

const TYPE_STYLES = {
  INFO: 'bg-slate-100 text-slate-600',
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  WARNING: 'bg-amber-100 text-amber-700',
  ACTION: 'bg-blue-100 text-blue-700',
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const refreshNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const [listResponse, countResponse] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(listResponse.notifications || []);
      setUnreadCount(countResponse.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const togglePanel = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);
    if (shouldOpen) refreshNotifications();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      setMarkingId(notification._id);
      setError('');
      try {
        await notificationService.markNotificationRead(notification._id);
        setNotifications((current) => current.map((item) => (
          item._id === notification._id ? { ...item, isRead: true } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to mark notification as read.');
        setMarkingId(null);
        return;
      }
      setMarkingId(null);
    }

    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={togglePanel}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold ring-2 ring-white flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          aria-label="Notifications panel"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll || loading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {markingAll ? 'Saving...' : 'Mark all as read'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-b border-rose-100" role="alert">
              {error}
            </div>
          )}

          <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">You are all caught up.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={markingId === notification._id || markingAll}
                      className={`w-full px-4 py-3 text-left transition disabled:opacity-60 ${
                        notification.isRead
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-emerald-50/70 hover:bg-emerald-50 border-l-2 border-emerald-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-xs ${notification.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-800'}`}>
                              {notification.title}
                            </span>
                            {notification.type && (
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${TYPE_STYLES[notification.type] || TYPE_STYLES.INFO}`}>
                                {notification.type}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 break-words">
                            {notification.message}
                          </p>
                          <time className="mt-1.5 block text-[10px] text-slate-400">
                            {formatDate(notification.createdAt)}
                          </time>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
