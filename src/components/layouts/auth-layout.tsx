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
      <div className="flex min-h-screen bg-[#23211f] overflow-hidden">
        {/* Left side - Dark Panel with Rings */}
        <div className="relative hidden w-full lg:flex lg:w-[45%] flex-col justify-center items-center overflow-hidden">
          {/* Concentric Rings Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="absolute border-[1px] border-white rounded-full h-[400px] w-[400px]"></div>
            <div className="absolute border-[1px] border-white rounded-full h-[600px] w-[600px]"></div>
            <div className="absolute border-[1px] border-white rounded-full h-[800px] w-[800px]"></div>
          </div>
          
          <div className="relative z-10 px-12 text-center mt-[-100px]">
            <p className="text-gray-400 text-sm mb-12">Streamlined admin dashboard — manage your agency effortlessly.</p>
            <h1 className="text-5xl font-medium tracking-tight text-white leading-tight drop-shadow-sm">
              Manage your<br />agency
            </h1>
            
            <div className="mt-16 relative mx-auto w-64 h-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border-[4px] border-gray-800">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop" 
                alt="Dashboard Mockup" 
                className="w-full h-full object-cover"
              />
              {/* Optional slight dark gradient over image to blend it */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Right side - White overlapping panel */}
        <div className="relative flex w-full flex-col justify-between bg-white lg:w-[55%] lg:rounded-l-[40px] px-8 py-10 sm:px-16 lg:px-24 xl:px-32 shadow-2xl">
          
          {/* Top Navbar area inside right panel */}
          <div className="flex justify-between items-center w-full">
            <Link
              className="flex items-center gap-2 text-gray-900 transition-transform hover:opacity-80"
              to={paths.home.getHref()}
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600">
                <div className="size-6 rounded-full bg-white flex items-center justify-center">
                  <Sparkles className="size-4 text-pink-500" />
                </div>
              </div>
              <span className="text-xl font-medium tracking-tight">Made Agency</span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="mx-auto w-full max-w-[400px] py-12">
            <h2 className="text-4xl font-normal tracking-tight text-gray-900 mb-10">
              Sign In
            </h2>

            <div>
              {children}
            </div>
          </div>

          {/* Footer Area inside right panel */}
          <div className="flex justify-between items-center w-full text-xs text-gray-400 font-medium">
            <p>&copy; {new Date().getFullYear()} Made Agency Inc.</p>
          </div>
        </div>
      </div>
    </>
  );
};
