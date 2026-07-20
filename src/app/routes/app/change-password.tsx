import { ContentLayout } from '@/components/layouts';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { ShieldCheck } from 'lucide-react';

const ChangePasswordRoute = () => {
  return (
    <ContentLayout title="Security Settings">
      <div className="max-w-5xl mx-auto w-full mt-6">
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row">
          
          {/* Left Side: Image / Graphics */}
          <div className="md:w-[45%] relative bg-gray-900 overflow-hidden flex flex-col justify-center p-12 min-h-[300px]">
            {/* Background Image */}
            <img 
              src="https://images.unsplash.com/photo-1614064641913-a5323ea5eb0c?q=80&w=1000&auto=format&fit=crop" 
              alt="Security Abstract" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            {/* Color Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/80 via-indigo-900/80 to-black/90 pointer-events-none"></div>
            
            <div className="relative z-10 text-white space-y-6">
              <div className="inline-flex size-16 rounded-full bg-white/10 backdrop-blur-md items-center justify-center shadow-lg border border-white/20">
                <ShieldCheck className="size-8 text-indigo-300" />
              </div>
              <h2 className="text-4xl font-semibold tracking-tight leading-tight">
                Secure your<br/>account
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                Regularly updating your password ensures your agency dashboard and sensitive data remain protected. Choose a strong, unique password.
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="md:w-[55%] p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
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
