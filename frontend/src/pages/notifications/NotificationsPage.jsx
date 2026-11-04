import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, ShieldAlert, Sparkles, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../../services/api';

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Recently';
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      await fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications & Alerts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time notifications about detected opportunities, approvals, deadlines, and recruiter updates.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-[#05603a] hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#05603a]" />
          <p className="text-sm">Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <Bell className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">You're all caught up!</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You'll receive alerts here when new opportunities match your profile or applications require your review.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id || n._id}
              className={`p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-4 transition-colors hover:bg-gray-50/50 ${
                n.is_read ? 'bg-white' : 'bg-emerald-50/20'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    n.type === 'captcha'
                      ? 'bg-red-100 text-red-700'
                      : n.type === 'review_required'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-[#05603a]'
                  }`}
                >
                  {n.type === 'captcha' ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : n.type === 'review_required' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="font-bold text-gray-700">ApplyZen</span>
                    <span>•</span>
                    <span>{formatTimeAgo(n.created_at)}</span>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0 ml-1" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-snug">{n.title}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1 sm:line-clamp-2 mt-0.5">{n.message}</p>
                </div>
              </div>

              {n.action_url && (
                <Link
                  to={n.action_url}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#05603a] hover:bg-[#034a27] text-white text-[10px] sm:text-xs font-semibold shrink-0 transition-colors shadow-2xs whitespace-nowrap"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
