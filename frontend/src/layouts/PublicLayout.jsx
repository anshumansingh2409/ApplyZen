import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import PublicNavbar from '../components/navbar/PublicNavbar';
import FloatingCopilotButton from '../components/common/FloatingCopilotButton';
import BrandLogo from '../components/common/BrandLogo';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-gray-900">
      <PublicNavbar />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-14">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo to="/" size="sm" />
            </div>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              The AI Career Operating System that converts career emails into validated, policy-controlled job applications with zero hallucination guarantee.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><a href="#features" className="hover:text-[#05603a]">Opportunity Detection</a></li>
              <li><a href="#features" className="hover:text-[#05603a]">Resume Matching</a></li>
              <li><a href="#features" className="hover:text-[#05603a]">Form Understanding</a></li>
              <li><a href="#features" className="hover:text-[#05603a]">Application Tracking</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/pricing" className="hover:text-[#05603a]">Pricing Plans</Link></li>
              <li><Link to="/support" className="hover:text-[#05603a]">Help & Support</Link></li>
              <li><a href="#how-it-works" className="hover:text-[#05603a]">How It Works</a></li>
              <li><a href="#roadmap" className="hover:text-[#05603a]">Security & Policies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal & Ethics</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><span className="text-emerald-700 font-medium">✓ Zero-Hallucination Policy</span></li>
              <li><span className="text-emerald-700 font-medium">✓ Ethical Human-in-Loop</span></li>
              <li><span className="text-emerald-700 font-medium">✓ No Automated CAPTCHA Bypass</span></li>
              <li><span className="text-gray-400 text-xs">© 2026 applyZen. All rights reserved.</span></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Floating AI Copilot Trigger */}
      <FloatingCopilotButton />
    </div>
  );
}
