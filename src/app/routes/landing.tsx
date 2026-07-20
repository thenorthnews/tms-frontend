import { ArrowRight, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

const LandingRoute = () => {
  const navigate = useNavigate();
  const user = useUser();

  const handleStart = () => {
    if (user.data) {
      navigate(paths.app.dashboard.getHref());
    } else {
      navigate(paths.auth.login.getHref());
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
      <Head description="Made Agency - Find Your Perfect Maid" title="Made Agency | Home" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="size-6 text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Made Agency
          </span>
        </div>
        <div className="hidden space-x-8 md:flex">
          <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Services</a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
          <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
        </div>
        <div className="flex items-center space-x-4">
          {!user.data && (
            <button
              onClick={() => navigate(paths.auth.login.getHref())}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </button>
          )}
          <Button onClick={handleStart} className="rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white transition-all">
            {user.data ? 'Go to Dashboard' : 'Book a Maid'}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
                Find the Perfect Maid <br className="hidden sm:block" />
                <span className="text-blue-600">For Your Home</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl">
                Trusted, verified, and highly professional cleaning services tailored to your needs. Book top-rated maids in seconds.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Button
                  size="lg"
                  className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-transform"
                  onClick={handleStart}
                >
                  Find a Maid <ArrowRight className="ml-2 size-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:scale-105 transition-transform"
                  onClick={() => navigate(paths.auth.login.getHref())}
                >
                  Join as a Maid
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50/50 py-24" id="services">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Made Agency?
              </h2>
              <p className="mt-4 text-lg text-gray-500">Premium service designed for your peace of mind.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="size-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Verified Professionals</h3>
                <p className="mt-2 text-gray-500">Every maid undergoes strict background checks and interviews.</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Flexible Booking</h3>
                <p className="mt-2 text-gray-500">Book once or schedule weekly cleanings. Cancel anytime.</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-purple-100">
                  <Sparkles className="size-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Sparkling Clean</h3>
                <p className="mt-2 text-gray-500">Satisfaction guaranteed. We don't stop until your home shines.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-gray-400" />
            <span className="text-lg font-bold text-gray-900">Made Agency</span>
          </div>
          <p className="mt-4 text-sm text-gray-500 md:mt-0">
            &copy; {new Date().getFullYear()} Made Agency. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-500">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">Terms</a>
            <a href="#" className="text-gray-400 hover:text-gray-500">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingRoute;
