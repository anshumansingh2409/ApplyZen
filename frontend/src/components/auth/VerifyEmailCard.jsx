import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailCard({ email, onVerified }) {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [error, setError] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await verifyEmail({ email, otp: otp.trim() });
      if (onVerified) {
        onVerified(res);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code. Please check your email or resend.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResendStatus('');
    setError('');
    try {
      const res = await authService.resendVerification(email);
      setResendStatus(res.message || `A fresh 6-digit verification code has been sent to ${email}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center font-sans">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg className="w-8 h-8 text-[#05603a]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
        <span className="text-2xl font-bold tracking-tight text-[#05603a]">ApplyZen</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        Great, now verify your email
      </h1>

      {/* Envelope Illustration with Green Checkmark (matching Screenshot 3) */}
      <div className="flex justify-center mb-8">
        <div className="relative w-44 h-36">
          <svg viewBox="0 0 160 130" className="w-full h-full drop-shadow-xs" fill="none">
            {/* Envelope Back Body */}
            <rect x="20" y="35" width="120" height="85" rx="10" fill="#d1fae5" stroke="#05603a" strokeWidth="2.5" />
            
            {/* Letter Paper inside envelope */}
            <rect x="35" y="15" width="90" height="75" rx="6" fill="#ffffff" stroke="#05603a" strokeWidth="2.2" />
            <line x1="48" y1="32" x2="75" y2="32" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="42" x2="112" y2="42" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="52" x2="100" y2="52" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Verification Green Badge on Letter */}
            <circle cx="80" cy="38" r="16" fill="#05603a" />
            <path d="M73 38.5L78 43.5L88 33.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

            {/* Envelope Front Flaps (V-Fold) */}
            <path d="M21 42L76 85C78.5 87 81.5 87 84 85L139 42" stroke="#05603a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M21 118L64 80" stroke="#05603a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M139 118L96 80" stroke="#05603a" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 px-2">
        Check your inbox at <strong className="font-bold text-gray-900">{email}</strong> and enter the 6-digit code or click the verification link inside to complete your registration.
      </p>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resendStatus && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resendStatus}</span>
        </div>
      )}

      {/* Prominent 6-Digit OTP Verification Form */}
      <form onSubmit={handleVerifyOtp} className="mb-8">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Enter 6-Digit Verification Code (OTP)
        </label>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            autoFocus
            className="w-full sm:w-56 px-4 py-3 bg-gray-50 border-2 border-gray-300 focus:border-[#05603a] rounded-xl text-center text-2xl font-bold tracking-[8px] text-[#05603a] focus:bg-white focus:outline-none transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            <span>{verifying ? 'Verifying...' : 'Verify Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Spam reminder matching Screenshot 3 */}
      <p className="text-xs sm:text-sm text-gray-700 font-medium mb-2">
        <span className="font-bold text-gray-900">Don't see an email?</span> Check your spam folder.
      </p>

      {/* Resend Link matching Screenshot 3 */}
      <p className="text-xs sm:text-sm text-gray-700 font-medium">
        <span className="font-bold text-gray-900">Link expired?</span>{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[#05603a] hover:underline font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
        >
          {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
          <span>Resend verification email</span>
        </button>
      </p>
    </div>
  );
}
