import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/sidebar/DashboardSidebar';
import FloatingCopilotButton from '../components/common/FloatingCopilotButton';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  RefreshCw,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  CreditCard,
  LogOut,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import api from '../services/api';

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

export default function DashboardLayout() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [syncSuccess, setSyncSuccess] = React.useState(false);

  const [syncToast, setSyncToast] = useState(null);

  // Integration state
  const [integrationStatus, setIntegrationStatus] = useState({
    gmail: { connected: false },
    outlook: { connected: false }
  });

  // Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real integration and notification telemetry if available
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const intRes = await api.get('/integrations/status').catch(() => null);
        if (intRes?.data) {
          setIntegrationStatus(intRes.data);
        }
        const notifRes = await api.get('/notifications').catch(() => null);
        if (notifRes?.data && Array.isArray(notifRes.data)) {
          setNotifications(
            notifRes.data.slice(0, 5).map((n) => ({
              id: n.id || n._id,
              title: n.title || 'Career Alert',
              message: n.message || n.description,
              time: formatTimeAgo(n.created_at),
              unread: !(n.is_read ?? n.read)
            }))
          );
        } else {
          setNotifications([]);
        }
      } catch (err) {
        setNotifications([]);
      }
    };
    if (isAuthenticated) {
      fetchHeaderData();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSyncEmails = async () => {
    const isGmailConnected = integrationStatus?.gmail?.connected;
    const isOutlookConnected = integrationStatus?.outlook?.connected;

    if (!isGmailConnected && !isOutlookConnected) {
      navigate('/integrations');
      return;
    }

    setSyncing(true);
    setSyncToast(null);
    try {
      const provider = isGmailConnected ? 'gmail' : 'outlook';
      const res = await opportunityService.syncEmails(provider);
      if (res?.connected === false) {
        navigate('/integrations');
        return;
      }
      setSyncSuccess(true);
      const count = res?.synced_count ?? 0;
      setSyncToast(
        count > 0
          ? `Ingested ${count} new opportunities from ${res?.account_email || 'inbox'}!`
          : `Scan complete: No new career emails found.`
      );
      setTimeout(() => {
        setSyncSuccess(false);
      }, 2500);
      setTimeout(() => {
        setSyncToast(null);
      }, 5000);
    } catch (err) {
      console.error('Error syncing emails:', err);
      navigate('/integrations');
    } finally {
      setSyncing(false);
    }
  };

  const isPro = user?.subscription_plan?.toLowerCase() === 'pro';
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen flex bg-[#fbfdfc] overflow-x-hidden">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 max-w-full lg:pl-64">
        {/* Top Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-gray-100 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile Sidebar Toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>

          {/* Center: Open gap */}
          <div className="flex-1" />

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Inbox Integration Status Pills */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200/70 p-1.5 rounded-xl text-[11px] font-semibold text-gray-600">
              <Link
                to="/integrations"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                title="Google Gmail Integration"
              >
                <span className={`w-2 h-2 rounded-full ${integrationStatus?.gmail?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span>Gmail</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${integrationStatus?.gmail?.connected ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100'}`}>
                  {integrationStatus?.gmail?.connected ? 'Connected' : 'Connect'}
                </span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/integrations"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                title="Microsoft Outlook Integration"
              >
                <span className={`w-2 h-2 rounded-full ${integrationStatus?.outlook?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span>Outlook</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${integrationStatus?.outlook?.connected ? 'text-blue-700 bg-blue-50' : 'text-gray-500 bg-gray-100'}`}>
                  {integrationStatus?.outlook?.connected ? 'Connected' : 'Connect'}
                </span>
              </Link>
            </div>

            {/* Sync Email Button */}
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-[#05603a] hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {syncSuccess ? 'Synced Successfully!' : syncing ? 'Scanning Inboxes...' : 'Sync Career Emails'}
              </span>
            </button>

            {/* Notification Bell with Badge & Dropdown */}
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 divide-y divide-gray-100">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Notifications</h4>
                      <p className="text-[10px] text-gray-500">Autonomous event alerts & status</p>
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotificationMenu(false)}
                      className="text-[11px] text-[#05603a] font-bold hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  {/* Compact Mobile Push Notification Style */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 space-y-1">
                        <Bell className="w-5 h-5 mx-auto text-gray-300 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">No notifications yet</p>
                        <p className="text-[10px] text-gray-400">You're all caught up! Real alerts will appear here as opportunities are detected.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 hover:bg-gray-50/80 transition-colors flex items-start gap-2.5 ${
                            item.unread ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#05603a] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-gray-900 truncate leading-tight">{item.title}</p>
                              <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2 pb-1 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotificationMenu(false)}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-block py-1"
                    >
                      Manage Notification Preferences →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Circular User Profile Avatar - Sleek, Small & Far Right */}
            <div className="relative pl-0.5 sm:pl-1 border-l border-gray-100" ref={profileMenuRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotificationMenu(false);
                }}
                className="flex items-center gap-2 p-0.5 sm:p-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none"
              >
                {/* Circle Avatar with Image / Initials */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold ring-2 ring-emerald-200/70 shadow-2xs relative shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                {/* User Name & Role (Desktop only) */}
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{user?.full_name || 'Applicant'}</p>
                    {isPro && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1 py-0.2 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-snug">
                    {user?.role || 'Software Engineer'}
                  </p>
                </div>

                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 divide-y divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#05603a] border border-emerald-200">
                        {user?.subscription_plan || 'Free'} Plan
                      </span>
                      {isPro ? (
                        <span className="text-[10px] text-emerald-700 font-semibold">✓ Copilot Active</span>
                      ) : (
                        <Link
                          to="/pricing"
                          onClick={() => setShowProfileMenu(false)}
                          className="text-[10px] text-emerald-800 font-bold hover:underline"
                        >
                          Upgrade to Pro →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="py-1 text-xs text-gray-700 font-medium">
                    <Link
                      to="/career-profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>My Career Ground Truth</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-500" />
                      <span>Account & AI Settings</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5 text-gray-500" />
                      <span>Notifications Center</span>
                    </Link>
                    <Link
                      to="/pricing"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                      <span>Subscription & Billing</span>
                    </Link>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sync Toast Notification Banner */}
        {syncToast && (
          <div className="bg-[#05603a] text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>{syncToast}</span>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-white/80 hover:text-white cursor-pointer text-base leading-none px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>

      {/* Persistent Copilot Chat Button */}
      <FloatingCopilotButton />
    </div>
  );
}
