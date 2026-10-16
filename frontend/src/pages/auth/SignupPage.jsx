import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, AtSign, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';
import MicrosoftAuthModal from '../../components/auth/MicrosoftAuthModal';
import VerifyEmailCard from '../../components/auth/VerifyEmailCard';
import { googleAuthClient } from '../../services/googleAuth';
import { microsoftAuthClient } from '../../services/microsoftAuth';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification state
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // OAuth Modal states
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  const { signup, setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleManualSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(email, password, fullName, username || undefined);
      
      // Verification required: switch to Screenshot 3 card
      if (res.status === 'pending_verification' || !res.access_token) {
        setRegisteredEmail(res.email || email);
        setIsPendingVerification(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError('');
    setGoogleLoading(true);

    googleAuthClient.startOAuthFlow({
      mode: 'signup',
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

  const handleOutlookClick = () => {
    setError('');
    setMicrosoftLoading(true);

    microsoftAuthClient.startOAuthFlow({
      mode: 'signup',
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

  // If user signed up manually, display the "Great, now verify your email" screen (Screenshot 3)
  if (isPendingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <VerifyEmailCard
          email={registeredEmail}
          onVerified={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <svg className="w-8 h-8 text-[#05603a]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <span className="text-2xl font-bold tracking-tight text-[#05603a]">ApplyZen</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create your Career Copilot</h2>
        <p className="mt-1.5 text-sm text-gray-600">
          Supercharge your career opportunities with autonomous intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 sm:rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social OAuth Buttons (Google & Outlook ONLY) */}
          <div className="space-y-3 mb-5">
            {/* Continue with Google button */}
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

            {/* Continue with Outlook button */}
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
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Manual Signup Form */}
          <form className="space-y-4" onSubmit={handleManualSignup}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Anshuman Singh"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">Username</label>
                <span className="text-[11px] text-gray-400">Used for login</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, ''))}
                  placeholder="e.g. anshumansingh"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">We'll send a 6-digit verification code to this inbox</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant setup, free tier included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real email verification protection</span>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#05603a] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
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

