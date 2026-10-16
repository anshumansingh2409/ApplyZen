import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-[#ffffff]/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo matching image */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#05603a] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <span className="text-white font-extrabold text-xl tracking-tight">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">ApplyZen</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-600">
          <a href="#features" className="hover:text-[#05603a] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#05603a] transition-colors">How It Works</a>
          <a href="#roadmap" className="hover:text-[#05603a] transition-colors">Roadmap</a>
          <Link to="/pricing" className="hover:text-[#05603a] transition-colors">Pricing</Link>
          <Link to="/support" className="hover:text-[#05603a] transition-colors">Support</Link>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#05603a] hover:bg-[#034a27] text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[15px] font-medium text-gray-700 hover:text-[#05603a] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#05603a] hover:bg-[#034a27] text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
