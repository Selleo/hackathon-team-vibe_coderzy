"use client";

import { useState } from "react";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation (only for sign up)
    if (isSignUp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate login (no backend validation)
    setTimeout(() => {
      localStorage.setItem("userIsLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      setIsLoading(false);
      onLoginSuccess();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2">
            ViaMent
          </h1>
          <p className="text-gray-400 text-lg">Your AI-powered learning companion</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-gray-400 mb-6">
            {isSignUp ? "Sign up to start your learning journey" : "Sign in to continue your learning journey"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`w-full bg-gray-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all border ${
                  errors.email
                    ? "border-red-500/50 focus:ring-red-500/50"
                    : "border-gray-600/50 focus:ring-cyan-500/50"
                }`}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`w-full bg-gray-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all border ${
                  errors.password
                    ? "border-red-500/50 focus:ring-red-500/50"
                    : "border-gray-600/50 focus:ring-cyan-500/50"
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Input (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  className={`w-full bg-gray-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all border ${
                    errors.confirmPassword
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : "border-gray-600/50 focus:ring-cyan-500/50"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Sign up" : "Sign in"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrors({});
                      setConfirmPassword("");
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrors({});
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
