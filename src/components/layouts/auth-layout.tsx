import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Head } from '@/components/seo';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

type LayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AuthLayout = ({ children, title }: LayoutProps) => {
  const user = useUser();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const navigate = useNavigate();

  useEffect(() => {
    if (user.data) {
      navigate(redirectTo ? redirectTo : paths.app.dashboard.getHref(), {
        replace: true,
      });
    }
  }, [user.data, navigate, redirectTo]);

  return (
    <>
      <Head title={title} />
      <div className="flex min-h-screen overflow-hidden bg-[#23211f]">
        {/* Left side - Dark Panel with Rings */}
        <div className="relative hidden w-full flex-col items-center justify-center overflow-hidden lg:flex lg:w-[45%]">
          {/* Concentric Rings Background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
            <div className="absolute size-[400px] rounded-full border-DEFAULT border-white"></div>
            <div className="absolute size-[600px] rounded-full border-DEFAULT border-white"></div>
            <div className="absolute size-[800px] rounded-full border-DEFAULT border-white"></div>
          </div>

          <div className="relative z-10 mt-[-100px] px-12 text-center">
            <p className="mb-12 text-sm text-gray-400">
              Streamlined task management dashboard — manage your workflow
              effortlessly.
            </p>
            <h1 className="text-5xl font-medium leading-tight tracking-tight text-white drop-shadow-sm">
              Manage your
              <br />
              tasks
            </h1>

            <div className="relative mx-auto mt-16 h-auto w-64 overflow-hidden rounded-3xl border-4 border-gray-800 shadow-2xl shadow-black/50">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
                alt="Dashboard Mockup"
                className="size-full object-cover"
              />
              {/* Optional slight dark gradient over image to blend it */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Right side - White overlapping panel */}
        <div className="relative flex w-full flex-col justify-between bg-white px-8 py-10 shadow-2xl sm:px-16 lg:w-[55%] lg:rounded-l-[40px] lg:px-24 xl:px-32">
          {/* Top Navbar area inside right panel */}
          <div className="flex w-full items-center justify-between">
            <Link
              className="flex items-center gap-2 text-gray-900 transition-transform hover:opacity-80"
              to={paths.home.getHref()}
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600">
                <div className="flex size-6 items-center justify-center rounded-full bg-white">
                  <Sparkles className="size-4 text-pink-500" />
                </div>
              </div>
              <span className="text-xl font-medium tracking-tight">
                TaskFlow
              </span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="mx-auto w-full max-w-[400px] py-12">
            <h2 className="mb-10 text-4xl font-normal tracking-tight text-gray-900">
              Sign In
            </h2>

            <div>{children}</div>
          </div>

          {/* Footer Area inside right panel */}
          <div className="flex w-full items-center justify-between text-xs font-medium text-gray-400">
            <p>&copy; {new Date().getFullYear()} TaskFlow Inc.</p>
          </div>
        </div>
      </div>
    </>
  );
};
