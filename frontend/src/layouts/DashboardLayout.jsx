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
  Layers
} from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import api from '../services/api';

export default function DashboardLayout() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = React.useState(false);
  const [syncSuccess, setSyncSuccess] = React.useState(false);

  // Integration state
  const [integrationStatus, setIntegrationStatus] = useState({
    gmail: { connected: true },
    outlook: { connected: true }
  });

  // Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Opportunity Detected',
      message: 'Extracted Software Engineer role at Stripe from recruitment email.',
      time: '10m ago',
      unread: true
    },
    {
      id: '2',
      title: 'Form Pre-filled',
      message: 'Razorpay application fields mapped with 98% confidence.',
      time: '1h ago',
      unread: true
    },
    {
      id: '3',
      title: 'Eligibility Verified',
      message: 'Education CGPA ground truth matched job specifications.',
      time: '3h ago',
      unread: false
    }
  ]);

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
        if (notifRes?.data && notifRes.data.length > 0) {
          setNotifications(
            notifRes.data.slice(0, 5).map((n) => ({
              id: n.id || n._id,
              title: n.title || 'Career Alert',
              message: n.message || n.description,
              time: 'Just now',
              unread: !n.read
            }))
          );
        }
      } catch (err) {
        // Fallback to initial mock notifications
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
    setSyncing(true);
    try {
      await opportunityService.syncDemoEmails();
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const isPro = user?.subscription_plan?.toLowerCase() === 'pro';
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen flex bg-[#fbfdfc]">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">ApplyZen Platform</h1>
              {isPro && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Autonomous Career Operating System</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Inbox Integration Status Pills */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200/70 p-1.5 rounded-xl text-[11px] font-semibold text-gray-600">
              <Link
                to="/integrations"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                title="Google Gmail Integration"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gmail</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">Synced</span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/integrations"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                title="Microsoft Outlook Integration"
              >
                <span className={`w-2 h-2 rounded-full ${integrationStatus?.outlook?.connected ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                <span>Outlook</span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-bold">Active</span>
              </Link>
            </div>

            {/* Sync Email Button */}
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-[#05603a] hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {syncSuccess ? 'Synced New Emails!' : syncing ? 'Scanning Inboxes...' : 'Sync Career Emails'}
              </span>
            </button>

            {/* Notification Bell with Badge & Dropdown */}
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 divide-y divide-gray-100">
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

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3 ${item.unread ? 'bg-emerald-50/30' : ''
                          }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#05603a] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-snug">{item.title}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
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

            {/* Circular User Profile Avatar with Role & Dropdown Menu */}
            <div className="relative pl-1 border-l border-gray-100" ref={profileMenuRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotificationMenu(false);
                }}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none"
              >
                {/* Circle Avatar with Image / Initials */}
                <div className="w-9 h-9 rounded-full bg-[#05603a] text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-200/70 shadow-2xs relative">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                {/* User Name & Role */}
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

                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Persistent Copilot Chat Button */}
      <FloatingCopilotButton />
    </div>
  );
}
