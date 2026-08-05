import { ShieldCheck } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

const ChangePasswordRoute = () => {
  return (
    <ContentLayout title="Security Settings">
      <div className="mx-auto mt-6 w-full max-w-5xl">
        <div className="flex flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl md:flex-row">
          {/* Left Side: Image / Graphics */}
          <div className="relative flex min-h-[300px] flex-col justify-center overflow-hidden bg-gray-900 p-12 md:w-[45%]">
            {/* Background Image */}
            <img
              src="https://images.unsplash.com/photo-1614064641913-a5323ea5eb0c?q=80&w=1000&auto=format&fit=crop"
              alt="Security Abstract"
              className="absolute inset-0 size-full object-cover opacity-40 mix-blend-overlay"
            />
            {/* Color Overlay Gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-purple-900/80 via-indigo-900/80 to-black/90"></div>

            <div className="relative z-10 space-y-6 text-white">
              <div className="inline-flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
                <ShieldCheck className="size-8 text-indigo-300" />
              </div>
              <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                Secure your
                <br />
                account
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-gray-300">
                Regularly updating your password ensures your agency dashboard
                and sensitive data remain protected. Choose a strong, unique
                password.
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="flex flex-col justify-center bg-white p-8 md:w-[55%] md:p-12 lg:p-16">
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Change Password
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please enter your current password and choose a new one.
              </p>
            </div>

            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
};

export default ChangePasswordRoute;
