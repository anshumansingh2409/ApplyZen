import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

export default function DashboardSidebar({ isOpen = false, onClose = () => {} }) {
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - 100% Fixed, never moves on page scroll */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand logo & mobile close button */}
        <div className="h-16 sm:h-20 px-5 flex items-center justify-between border-b border-gray-200 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <BrandLogo size="sm" showBadge={isPro ? "PRO" : null} />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden cursor-pointer transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu with ultra-thin custom scrollbar */}
        <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
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
                    onClick={onClose}
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
                    onClick={onClose}
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
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-100 shrink-0">
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
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
