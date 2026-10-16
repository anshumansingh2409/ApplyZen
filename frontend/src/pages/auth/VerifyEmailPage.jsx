import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      handleTokenVerification(token);
    }
  }, [token]);

  const handleTokenVerification = async (verifyToken) => {
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ token: verifyToken, email: emailParam || undefined });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email: email.trim(), otp: otp.trim() });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resending) return;
    setResending(true);
    setResendStatus('');
    setError('');
    try {
      const res = await authService.resendVerification(email.trim());
      setResendStatus(res.message || 'New verification link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <svg className="w-8 h-8 text-[#05603a]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <span className="text-2xl font-bold tracking-tight text-[#05603a]">ApplyZen</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-sm border border-gray-200 rounded-3xl text-center">
          {loading ? (
            <div className="py-10 space-y-4">
              <Loader2 className="w-12 h-12 text-[#05603a] animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Verifying your email...</h2>
              <p className="text-sm text-gray-500">Please wait while we activate your account.</p>
            </div>
          ) : success ? (
            <div className="space-y-5 py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#05603a]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Email Verified!</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your email has been successfully verified. You're ready to automate your career applications with ApplyZen.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">Redirecting automatically in a moment...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Verify Your Email</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email and the 6-digit code or request a new link.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendStatus && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="e.g. 123456"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest text-[#05603a] focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp.trim()}
                  className="w-full py-3 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Verify Email
                </button>
              </form>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email.trim()}
                  className="text-[#05603a] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Resend link</span>
                </button>

                <Link to="/login" className="text-gray-500 hover:text-gray-800">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
