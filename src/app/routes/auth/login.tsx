import { Eye, EyeOff, Mail, Lock, KanbanSquare } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';

import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { useLogin, useUser } from '@/lib/auth';

const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(5, 'Password must be at least 5 characters'),
});

const LoginRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const user = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user.data) {
      navigate(redirectTo ? redirectTo : paths.app.dashboard.getHref(), {
        replace: true,
      });
    }
  }, [user.data, navigate, redirectTo]);

  const login = useLogin({
    onSuccess: () => {
      navigate(redirectTo ? redirectTo : paths.app.dashboard.getHref(), {
        replace: true,
      });
    },
  });

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = loginInputSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    login.mutate(
      { email, password },
      {
        onError: (error: any) => {

          setErrors({
            api:
              error?.message ||
              'Invalid email or password. Use admin@gmail.com / admin123.',
          });
        },
      },
    );
  };

  return (
    <>
      <Head title="Login - TaskFlow" />

      <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased">
        {/* Left Half (60%): Branded graphic panel */}
        <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#1E3A8A] p-12 lg:flex lg:w-3/5 xl:p-16">
          {/* Graphic/Light FX Background */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1E3A8A] via-[#1E3B8B] to-[#0F172A]"></div>
          <div className="pointer-events-none absolute right-[-10%] top-[-10%] size-[500px] rounded-full bg-[#0EA5E9] opacity-15 blur-[120px]"></div>
          <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] size-[600px] rounded-full bg-[#3B82F6] opacity-10 blur-[150px]"></div>

          {/* Header Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0EA5E9] shadow-lg shadow-sky-500/20">
              <KanbanSquare className="size-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Task<span className="text-[#0EA5E9]">Flow</span>
            </span>
          </div>

          {/* Center Graphic & Slogan */}
          <div className="relative z-10 my-auto max-w-lg space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
                Manage tasks.
                <br />
                Track teams.
                <br />
                Deliver on time.
              </h1>
              <p className="text-lg text-slate-300">
                The all-in-one workspace for B2B operations, resource planning,
                and sprint analytics.
              </p>
            </div>

            {/* Interactive Flow Diagram/Task Cards Demonstration */}
            <div className="space-y-4 rounded-2xl border border-slate-700/30 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
                <span className="text-sm font-semibold text-slate-300">
                  Active Board Project
                </span>
                <span className="rounded-full bg-[#0EA5E9]/20 px-2 py-0.5 text-xs font-semibold text-[#0EA5E9]">
                  In Progress
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-700/20 bg-slate-800/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-white">
                      Sync user module schemas
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Completed</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#0EA5E9]/30 bg-[#1E3A8A]/30 p-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="size-2 animate-pulse rounded-full bg-sky-400"></div>
                    <span className="text-sm font-medium text-white">
                      Design dashboard auth forms
                    </span>
                  </div>
                  <span className="text-xs font-medium text-sky-400">92%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700/20 bg-slate-800/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-amber-400"></div>
                    <span className="text-sm font-medium text-white">
                      Implement B2B task board
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Todo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notes & Responsive Guideline */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} TaskFlow Inc. All rights
              reserved.
            </p>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-amber-400"></span>
              <span>1440x900 Optimized (Responsive Switcher Active)</span>
            </div>
          </div>
        </div>

        {/* Right Half (40%): Login Form Container */}
        <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 sm:px-12 md:px-20 lg:w-2/5">
          {/* Logo representation on Mobile/Tablet screens */}
          <div className="absolute left-8 top-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A8A]">
              <KanbanSquare className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">TaskFlow</span>
          </div>

          {/* Responsive Behavior Note Badge for Screen sizes */}
          <div className="absolute right-8 top-8 hidden font-mono text-[10px] text-slate-400 sm:block md:hidden lg:block">
            * Collapses dynamically below 1024px
          </div>

          {/* Center Card Container */}
          <div className="w-full max-w-[420px] space-y-8">
            {/* Title Block */}
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
                Welcome to TaskFlow
              </h2>
              <p className="text-sm text-slate-500">
                Sign in to access your workspace.
              </p>
            </div>

            {errors.api && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
                <p className="mb-1 font-semibold">Authentication Failed</p>
                <p className="text-xs text-rose-700">{errors.api}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="size-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors((prev) => {
                          const { email, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="name@company.com"
                    className={`h-11 w-full border bg-white pl-10 pr-4 ${errors.email
                      ? 'border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#1E3A8A] focus:ring-sky-100'
                      } rounded-[10px] text-sm text-slate-900 transition-all duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-4`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="size-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => {
                          const { password, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="••••••••"
                    className={`h-11 w-full border bg-white px-10 ${errors.password
                      ? 'border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#1E3A8A] focus:ring-sky-100'
                      } rounded-[10px] text-sm text-slate-900 transition-all duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-4`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500">{errors.password}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={login.isPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1E3A8A] text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#152a63] hover:shadow-blue-900/20 active:scale-[0.98]"
              >
                {login.isPending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          {/* Mobile Footer text */}
          <div className="absolute bottom-6 text-center text-xs text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} TaskFlow. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginRoute;
