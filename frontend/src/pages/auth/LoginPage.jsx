import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronLeft,
  RotateCw
} from 'lucide-react';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';
import MicrosoftAuthModal from '../../components/auth/MicrosoftAuthModal';
import VerifyEmailCard from '../../components/auth/VerifyEmailCard';
import { googleAuthClient } from '../../services/googleAuth';
import { microsoftAuthClient } from '../../services/microsoftAuth';
import { authService } from '../../services/auth.service';

export default function LoginPage({ defaultMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || searchParams.get('tab') || defaultMode;

  // View modes: 'login' | 'forgot' | 'reset'
  const [viewMode, setViewMode] = useState(initialMode === 'forgot' || initialMode === 'reset' ? initialMode : 'login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showVerifyCard, setShowVerifyCard] = useState(false);

  // Forgot & Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, setAuthUser } = useAuth();
  const navigate = useNavigate();

  // Handle countdown for resending reset code
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Login form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.error_code === 'EMAIL_NOT_VERIFIED' || errData?.message?.includes('verify your email')) {
        setUnverifiedEmail(identifier);
        setError('Please verify your email address before signing in.');
      } else {
        setError(errData?.message || 'Invalid username/email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth click
  const handleGoogleClick = () => {
    setError('');
    setGoogleLoading(true);

    googleAuthClient.startOAuthFlow({
      mode: 'login',
      onSuccess: (authResult) => {
        setGoogleLoading(false);
        if (authResult?.user) {
          setAuthUser(authResult.user);
        }
        window.location.href = '/dashboard';
      },
      onError: (errMsg) => {
        setGoogleLoading(false);
        setError(errMsg);
      },
      onNeedsClientId: () => {
        setGoogleLoading(false);
        setGoogleModalOpen(true);
      }
    });
  };

  // Microsoft / Outlook OAuth click
  const handleOutlookClick = () => {
    setError('');
    setMicrosoftLoading(true);

    microsoftAuthClient.startOAuthFlow({
      mode: 'login',
      onSuccess: (authResult) => {
        setMicrosoftLoading(false);
        if (authResult?.user) {
          setAuthUser(authResult.user);
        }
        window.location.href = '/dashboard';
      },
      onError: (errMsg) => {
        setMicrosoftLoading(false);
        setError(errMsg);
      },
      onNeedsClientId: () => {
        setMicrosoftLoading(false);
        setMicrosoftModalOpen(true);
      }
    });
  };

  // Open Forgot Password
  const openForgotPassword = (e) => {
    e?.preventDefault();
    setError('');
    setForgotError('');
    setForgotSuccess('');
    if (identifier.includes('@')) {
      setForgotEmail(identifier.trim());
    }
    setViewMode('forgot');
  };

  // Send Reset Code
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || `A 6-digit reset code has been sent to ${forgotEmail}.`);
      setResendCooldown(60);
      setViewMode('reset');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend Reset Code
  const handleResendResetCode = async () => {
    if (resendCooldown > 0 || !forgotEmail) return;
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || `A fresh 6-digit code has been sent to ${forgotEmail}.`);
      setResendCooldown(60);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Reset Password Submit
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.resetPassword({
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        new_password: newPassword
      });

      setForgotSuccess(res.message || 'Password reset successful! You can now sign in.');
      setTimeout(() => {
        setIdentifier(forgotEmail);
        setViewMode('login');
        setForgotSuccess('Password updated successfully. Please enter your new password to sign in.');
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (showVerifyCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <VerifyEmailCard email={unverifiedEmail || identifier} onVerified={() => navigate('/dashboard')} />
        <div className="text-center mt-6">
          <button
            onClick={() => setShowVerifyCard(false)}
            className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-8">
          <svg className="w-8 h-8 text-[#05603a]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <span className="text-2xl font-bold tracking-tight text-[#05603a]">ApplyZen</span>
        </div>

        {/* =========================================================================
            VIEW 1: STANDARD LOGIN
        ========================================================================= */}
        {viewMode === 'login' && (
          <div>
            <h1 className="text-3xl font-normal text-[#05603a] tracking-tight font-serif mb-2">
              Log in to your account
            </h1>
            <p className="text-sm font-semibold text-gray-900 mb-8">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {unverifiedEmail && (
                  <button
                    type="button"
                    onClick={() => setShowVerifyCard(true)}
                    className="text-left font-bold text-[#05603a] hover:underline pt-1 cursor-pointer"
                  >
                    Click here to verify your email now &rarr;
                  </button>
                )}
              </div>
            )}

            {/* Success message banner (e.g. after password reset) */}
            {forgotSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Real Social OAuth Buttons (Google & Outlook ONLY) */}
            <div className="space-y-3 mb-6">
              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || microsoftLoading}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-2xs cursor-pointer group disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Continue with Outlook */}
              <button
                type="button"
                onClick={handleOutlookClick}
                disabled={googleLoading || microsoftLoading}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-2xs cursor-pointer group disabled:opacity-60"
              >
                {microsoftLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                )}
                <span>{microsoftLoading ? 'Connecting to Outlook...' : 'Continue with Outlook'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white sm:bg-gray-50 px-3 text-gray-500 font-medium">
                  Or with email and password
                </span>
              </div>
            </div>

            {/* Email & Password Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-800">Password</label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs text-[#05603a] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Signing In...' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: FORGOT PASSWORD (STEP 1: ENTER EMAIL)
        ========================================================================= */}
        {viewMode === 'forgot' && (
          <div>
            <button
              type="button"
              onClick={() => { setViewMode('login'); setForgotError(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>

            <h1 className="text-3xl font-normal text-[#05603a] tracking-tight font-serif mb-2">
              Reset your password
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Enter your registered email address below. We'll send you a 6-digit verification code to securely reset your password.
            </p>

            {forgotError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleForgotSubmit}>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending verification code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  Already have an OTP code?{' '}
                  <button
                    type="button"
                    onClick={() => setViewMode('reset')}
                    className="text-[#05603a] font-bold hover:underline cursor-pointer"
                  >
                    Enter Code Directly
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: RESET PASSWORD (STEP 2: ENTER OTP & NEW PASSWORD)
        ========================================================================= */}
        {viewMode === 'reset' && (
          <div>
            <button
              type="button"
              onClick={() => { setViewMode('forgot'); setForgotError(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to email entry</span>
            </button>

            <h1 className="text-3xl font-normal text-[#05603a] tracking-tight font-serif mb-2">
              Set new password
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Enter the 6-digit code sent to <strong className="text-gray-900">{forgotEmail}</strong> and your new password below.
            </p>

            {forgotSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleResetSubmit}>
              {/* 6-Digit OTP */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  6-Digit Verification Code (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base tracking-widest font-mono font-bold text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#05603a] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendResetCode}
                  disabled={resendCooldown > 0 || forgotLoading}
                  className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#05603a] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${forgotLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  Cancel & Sign In
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Google OAuth Setup Modal if Client ID needed */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onConfigured={handleGoogleClick}
      />

      {/* Microsoft OAuth Setup Modal if Client ID needed */}
      <MicrosoftAuthModal
        isOpen={microsoftModalOpen}
        onClose={() => setMicrosoftModalOpen(false)}
        onConfigured={handleOutlookClick}
      />
    </div>
  );
}

