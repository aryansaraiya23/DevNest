import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Code2, Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

interface SignUpPageProps {
  onNavigateToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setNameError('Full name is required.');
      isValid = false;
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register({ name, email, password, confirmPassword });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-brand-500/20 mb-3">
            <Code2 className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Start building projects with DevNest Cloud IDE</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="signup-name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Jane Doe"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  nameError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-brand-500/80 focus:ring-brand-500/20'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {nameError && <p className="text-xs text-rose-400 mt-1">{nameError}</p>}
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="signup-email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="jane@example.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  emailError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-brand-500/80 focus:ring-brand-500/20'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {emailError && <p className="text-xs text-rose-400 mt-1">{emailError}</p>}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="At least 6 characters"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  passwordError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-brand-500/80 focus:ring-brand-500/20'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-rose-400 mt-1">{passwordError}</p>}
          </div>

          {/* Confirm Password field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                placeholder="Repeat your password"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  confirmPasswordError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-brand-500/80 focus:ring-brand-500/20'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPasswordError && <p className="text-xs text-rose-400 mt-1">{confirmPasswordError}</p>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creating account...</span>
              </span>
            ) : (
              <>
                <span>Sign up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Footer switch to login */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors ml-1"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
