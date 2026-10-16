import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  FileCheck,
  FileText,
  UserCheck,
  MailCheck,
  Bell,
  Bot,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardSidebar() {
  const { logout, user } = useAuth();

  // Section 1: Core Operations
  const primaryNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Opportunities', path: '/opportunities', icon: Sparkles },
    { label: 'Applications', path: '/applications', icon: FileCheck },
    { label: 'Resumes', path: '/resumes', icon: FileText },
    { label: 'Career Ground Truth', path: '/career-profile', icon: UserCheck },
    { label: 'AI Assistant', path: '/assistant', icon: Bot },
  ];

  // Section 2: Integrations, System & Support
  const secondaryNavItems = [
    { label: 'Email Integrations', path: '/integrations', icon: MailCheck },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Pricing & Plans', path: '/pricing', icon: CreditCard },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Help & Support', path: '/support', icon: HelpCircle },
  ];

  const isPro = user?.subscription_plan?.toLowerCase() === 'pro';

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand logo */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-[#05603a] flex items-center justify-center shadow-xs">
          <span className="text-white font-extrabold text-xl tracking-tight">A</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-gray-900 tracking-tight block">ApplyZen</span>
            {isPro && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                PRO
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Career OS</span>
        </div>
      </div>

      {/* Nav Menu divided into 2 distinct sections */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* SECTION 1: Core Operations */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Core Operations
          </div>
          <div className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#e6f4ea] text-[#05603a] font-bold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: System, Preferences & Support */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            System & Preferences
          </div>
          <div className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#e6f4ea] text-[#05603a] font-bold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 mb-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-100">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                {isPro && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1 py-0.2 rounded">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate">{user?.role || 'Software Engineer'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
