import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

export default function PublicNavbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo matching official branding */}
        <BrandLogo to="/" size="md" className="transition-transform hover:scale-[1.02]" />

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-600">
          <a href="#features" className="hover:text-[#05603a] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#05603a] transition-colors">How It Works</a>
          <a href="#roadmap" className="hover:text-[#05603a] transition-colors">Roadmap</a>
          <Link to="/pricing" className="hover:text-[#05603a] transition-colors">Pricing</Link>
          <Link to="/support" className="hover:text-[#05603a] transition-colors">Support</Link>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/login"
            className="text-[15px] font-semibold text-gray-700 hover:text-[#05603a] transition-colors px-2 py-1"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#05603a] hover:bg-[#034a27] text-white text-sm font-semibold shadow-xs transition-all hover:shadow"
          >
            Get Started Free
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-all cursor-pointer"
              title="Sign out of current account to test fresh login"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
