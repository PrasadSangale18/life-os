import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../utils/supabaseClient';
import type { User } from '../types';
import { PillarUniverse } from './PillarUniverse';
import './LoginScreen.css';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Compass,
  ArrowLeft
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess: (user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magic';

const PILLAR_DESCRIPTIONS: Record<string, { title: string; subtitle: string; color: string }> = {
  physical: { title: 'Physical', subtitle: 'The Foundation — vitality, endurance, recovery', color: '#10B981' },
  mental: { title: 'Mental', subtitle: 'The Operating System — clarity, cognition, focus', color: '#3B82F6' },
  financial: { title: 'Financial', subtitle: 'The Amplifier — resources, stewardship, autonomy', color: '#F59E0B' },
  spiritual: { title: 'Spiritual', subtitle: 'The Compass — purpose, presence, principles', color: '#A855F7' },
  relational: { title: 'Relational', subtitle: 'The Support Structure — connection, community, empathy', color: '#F43F5E' },
};

export const LoginScreen = ({ onSuccess }: LoginScreenProps) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

  // Check if session already exists in Supabase on load
  useEffect(() => {
    if (hasSupabase) {
      supabase.auth.getSession().then(({ data }: any) => {
        if (data?.session?.user) {
          const u = data.session.user;
          onSuccess({
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            email: u.email || 'user@sankalp.local'
          });
        }
      });
    }
  }, [onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (hasSupabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          if (data?.user) {
            onSuccess({
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || email
            });
            return;
          }
        } else {
          // Local-First offline mode
          if (!email.trim()) {
            throw new Error('Please enter an email address.');
          }
          // Simulate instant local-first session creation
          setTimeout(() => {
            onSuccess({
              name: email.split('@')[0] || 'Personal OS',
              email: email.trim()
            });
          }, 400);
          return;
        }
      } else if (mode === 'signup') {
        if (hasSupabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName.trim() }
            }
          });
          if (error) throw error;
          if (data?.session?.user) {
            onSuccess({
              name: fullName.trim() || data.session.user.email?.split('@')[0] || 'User',
              email: data.session.user.email || email
            });
            return;
          } else {
            setSuccessMessage(`Account created! Check ${email} for confirmation link.`);
            setIsLoading(false);
            return;
          }
        } else {
          // Local-first workspace personalization
          if (!email.trim()) throw new Error('Please enter an email address.');
          setTimeout(() => {
            onSuccess({
              name: fullName.trim() || email.split('@')[0] || 'Personal OS',
              email: email.trim()
            });
          }, 400);
          return;
        }
      } else if (mode === 'magic') {
        if (hasSupabase) {
          const redirectUrl = window.location.origin + import.meta.env.BASE_URL;
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectUrl }
          });
          if (error) throw error;
          setSuccessMessage(`Magic link dispatched to ${email}. Check your inbox.`);
          setIsLoading(false);
          return;
        } else {
          throw new Error('Magic Link requires Supabase environment keys.');
        }
      } else if (mode === 'forgot') {
        if (hasSupabase) {
          const redirectUrl = window.location.origin + import.meta.env.BASE_URL;
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
          });
          if (error) throw error;
          setSuccessMessage(`Password recovery email sent to ${email}.`);
          setIsLoading(false);
          return;
        } else {
          throw new Error('Password recovery requires cloud synchronization setup.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
      setIsLoading(false);
    }
  };

  const handleGuestEntry = () => {
    setIsLoading(true);
    setTimeout(() => {
      onSuccess({
        name: 'Personal OS',
        email: 'local@lifeos.internal'
      });
    }, 250);
  };

  const activePillarDetail = hoveredPillar ? PILLAR_DESCRIPTIONS[hoveredPillar] : null;

  return (
    <div className="login-viewport">
      {/* Background Layers */}
      <div className="login-ambient-backdrop">
        <div className="ambient-radial-1" />
        <div className="ambient-radial-2" />
        <div className="ambient-radial-center" />
      </div>
      <div className="login-grid-overlay" />

      {/* Main Two-Column Container */}
      <div className="login-container">
        
        {/* Left Column: Brand & Animated 5-Pillar Constellation */}
        <div className="login-hero-col">
          
          <div className="reveal-0">
            <div className="brand-badge">
              <span className="brand-badge-dot" />
              <span>aisankalp • System Ready</span>
            </div>
          </div>

          <h1 className="hero-headline reveal-1">
            Your life. <br />
            <span className="hero-headline-accent">In alignment.</span>
          </h1>

          <p className="hero-description reveal-2">
            One intelligent personal operating system for your goals, knowledge, priorities, and daily execution.
          </p>

          {/* Interactive Five-Pillar Universe */}
          <div className="reveal-3">
            <PillarUniverse 
              hoveredPillar={hoveredPillar} 
              onHoverPillar={setHoveredPillar} 
            />
          </div>

          {/* Dynamic Pillar Focus Detail */}
          <div className="reveal-4">
            <div className="pillar-focus-badge">
              {activePillarDetail ? (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: activePillarDetail.color, boxShadow: `0 0 8px ${activePillarDetail.color}` }} />
                  <span style={{ fontWeight: 600, color: '#F4F5F8' }}>{activePillarDetail.title}:</span>
                  <span style={{ color: '#A3ACBA' }}>{activePillarDetail.subtitle}</span>
                </>
              ) : (
                <>
                  <Compass size={13} color="var(--login-accent)" />
                  <span style={{ color: '#A3ACBA' }}>Everything connected. Nothing overlooked.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="login-panel-col reveal-2">
          <div className="auth-card">
            
            {/* Form Header */}
            <div className="auth-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2 className="auth-title">
                  {mode === 'signin' && 'Welcome back.'}
                  {mode === 'signup' && 'Create workspace.'}
                  {mode === 'magic' && 'Passwordless Link.'}
                  {mode === 'forgot' && 'Reset Password.'}
                </h2>
                {hasSupabase ? (
                  <span className="ui-pill" style={{ color: '#10B981', borderColor: 'rgba(16,185,129,0.25)', fontSize: 10 }}>
                    Cloud Sync Active
                  </span>
                ) : (
                  <span className="ui-pill" style={{ color: 'var(--login-accent)', borderColor: 'rgba(139,156,255,0.25)', fontSize: 10 }}>
                    Local-First Engine
                  </span>
                )}
              </div>
              
              <p className="auth-subtitle">
                {mode === 'signin' && 'Sign in to access your personal command center.'}
                {mode === 'signup' && 'Begin organizing your life across five core pillars.'}
                {mode === 'magic' && 'Receive a one-click authentication link in your email.'}
                {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
              </p>
            </div>

            {/* Notification Banners */}
            {errorMessage && (
              <div className="auth-banner-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-banner-success" style={{ marginBottom: 16 }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div className="form-group reveal-init reveal-3">
                  <label className="form-label" htmlFor="fullName">Full Name</label>
                  <div className="form-input-wrapper">
                    <UserIcon size={14} className="input-icon-left" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Alex Hunter"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="form-input"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="form-group reveal-init reveal-3">
                <label className="form-label" htmlFor="email">Email address</label>
                <div className="form-input-wrapper">
                  <Mail size={14} className="input-icon-left" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password (Sign In & Sign Up) */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="form-group reveal-init reveal-4">
                  <div className="form-label">
                    <span>Password</span>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                        className="auth-link-btn"
                        style={{ fontSize: 11.5 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="form-input-wrapper">
                    <Lock size={14} className="input-icon-left" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={hasSupabase ? "••••••••••••" : "Optional for local mode"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="form-input"
                      disabled={isLoading}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required={hasSupabase}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="input-icon-btn"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Submit Button */}
              <div className="reveal-init reveal-5" style={{ marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'ring-spin 1s linear infinite' }} />
                      <span>{mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating…' : 'Sending…'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign in to aisankalp'}
                        {mode === 'signup' && 'Create Your Workspace'}
                        {mode === 'magic' && 'Send Magic Link'}
                        {mode === 'forgot' && 'Send Reset Email'}
                      </span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              {/* Local-First Guest Entry Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0', opacity: 0.7 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--login-border)' }} />
                <span style={{ fontSize: 11, color: 'var(--login-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--login-border)' }} />
              </div>

              {/* One-Click Offline Local-First Entry */}
              <button
                type="button"
                onClick={handleGuestEntry}
                disabled={isLoading}
                className="btn-guest"
                title="Enter directly into local IndexedDB without cloud dependencies"
              >
                <ShieldCheck size={14} color="#10B981" />
                <span>Continue Offline (Local-First Mode)</span>
              </button>

            </form>

            {/* Mode Navigation & Switchers */}
            <div className="auth-mode-links">
              {mode === 'signin' ? (
                <>
                  <span>New to SANKALP?</span>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="auth-link-btn"
                  >
                    Create workspace
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="auth-link-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <ArrowLeft size={12} />
                  <span>Back to Sign In</span>
                </button>
              )}
            </div>

            {/* Magic Link toggle for Supabase when in signin mode */}
            {mode === 'signin' && hasSupabase && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => { setMode('magic'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="auth-link-btn"
                  style={{ fontSize: 11.5, color: 'var(--login-text-tertiary)' }}
                >
                  Sign in with Magic Link instead
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
