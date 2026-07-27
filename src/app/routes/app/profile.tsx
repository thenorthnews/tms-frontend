import * as React from 'react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  User,
  Lock,
  Info,
  LogOut,
  Upload,
  Check,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useUser, useLogout } from '@/lib/auth';
import { useUpdateProfile } from '@/features/auth/api/update-profile';
import { useUploadFile } from '@/features/file/api/upload-file';
import { useChangePassword } from '@/features/auth/api/change-password';
import { Form, Input } from '@/components/ui/form';
import { z } from 'zod';

const profileFormSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  image: z.string().optional(),
});

const passwordFormSchema = z.object({
  oldPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

const ProfileRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const logout = useLogout();
  const { addNotification } = useNotifications();

  // --- ACTIVE TAB ---
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'about'>('account');

  // --- MUTATIONS ---
  const updateProfileMutation = useUpdateProfile({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Account profile details updated successfully',
        });
      },
    },
  });

  const uploadFileMutation = useUploadFile({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Avatar image updated',
        });
      },
    },
  });

  const changePasswordMutation = useChangePassword({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Password changed successfully',
        });
        // Clear password fields
        setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (err: any) => {
        addNotification({
          type: 'error',
          title: 'Failed to update password',
          message: err.message || 'Verification error.',
        });
      }
    }
  });

  const getPhoneStr = (p: any) => {
    if (!p) return '';
    if (typeof p === 'string') return p.replace(/\D/g, '').slice(0, 10);
    if (typeof p === 'object') {
      const num = p.number || p.phoneNumber || p.phone || '';
      return typeof num === 'string' ? num.replace(/\D/g, '').slice(0, 10) : String(num || '');
    }
    return String(p).replace(/\D/g, '').slice(0, 10);
  };

  // --- LOCAL FORMS STATE ---
  const [profileData, setProfileData] = useState({
    firstName: user.data?.firstName || '',
    lastName: user.data?.lastName || '',
    phoneNumber: getPhoneStr(user.data?.phoneNumber),
    image: user.data?.image || '',
  });

  // Keep state updated when user details finish loading
  React.useEffect(() => {
    if (user.data) {
      setProfileData({
        firstName: user.data.firstName || '',
        lastName: user.data.lastName || '',
        phoneNumber: getPhoneStr(user.data.phoneNumber),
        image: user.data.image || '',
      });
    }
  }, [user.data]);

  const [pwdData, setPwdData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user.isLoading) {
    return (
      <ContentLayout title="Settings">
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ContentLayout>
    );
  }

  if (!user.data) {
    return (
      <ContentLayout title="Settings">
        <div className="text-center text-red-500 py-12 font-bold flex flex-col items-center gap-2">
          <ShieldAlert className="size-8" />
          Please log in to view settings
        </div>
      </ContentLayout>
    );
  }

  const getRoleString = (r: any) => {
    if (r === 0 || r === 'CEO') return 'CEO';
    if (r === 1 || r === 'Manager') return 'Manager';
    if (r === 2 || r === 'Team Lead') return 'Team Lead';
    if (r === 4 || r === 'Employee') return 'Employee';
    return String(r);
  };

  const role = user.data.role;
  const roleString = getRoleString(role);
  const isEmployee = typeof role === 'number' ? role === 4 : String(role).toLowerCase() === 'employee';

  // Photo upload trigger
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFileMutation.mutateAsync({ file });
      if (response?.url) {
        setProfileData(prev => ({ ...prev, image: response.url }));
        // Save automatically
        updateProfileMutation.mutate({
          data: {
            ...profileData,
            image: response.url,
          }
        });
      }
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  // Submit profile details
  const handleProfileSave = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate({ data: values });
  };

  // Submit change password
  const handlePasswordSave = (values: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate({ data: values });
  };

  return (
    <ContentLayout title="Settings">
      <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-500 pb-12">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col lg:flex-row min-h-[600px]">

          {/* LEFT: Tab Navigation */}
          <div className="w-full lg:w-64 bg-slate-50/50 border-r border-slate-100 p-5 flex flex-col justify-between select-none">

            {/* Nav list */}
            <div className="space-y-1">

              {/* Horizontal Scroll wrapper for mobile viewport, standard column layout for desktop */}
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 border-b border-slate-200/50 lg:border-b-0">

                {/* Account tab */}
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'account'
                    ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                >
                  <User className="size-4" />
                  Account Profile
                </button>



                {/* Security tab */}
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'security'
                    ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                >
                  <Lock className="size-4" />
                  Security Lock
                </button>

                {/* About tab */}
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'about'
                    ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                >
                  <Info className="size-4" />
                  About TaskFlow
                </button>

              </div>
            </div>

          </div>

          {/* RIGHT: Content panel */}
          <div className="flex-1 p-6 sm:p-10 bg-white text-left">

            {/* ACCOUNT TAB PANEL */}
            {activeTab === 'account' && (
              <Form
                schema={profileFormSchema}
                onSubmit={handleProfileSave}
                options={{
                  values: profileData,
                }}
                className="space-y-6"
              >
                {({ register, formState }) => (
                  <>
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Account Details</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Manage your personal details and avatar preferences</p>
                    </div>

                    {/* Avatar and file upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-4.5 border-b border-slate-50 pb-5">
                      <div className="size-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                        {profileData.image ? (
                          <img src={profileData.image} alt="Avatar" className="size-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-base font-bold">
                            {profileData.firstName?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="text-center sm:text-left space-y-2">
                        <label className="block text-xs font-bold text-slate-700">Avatar Photo</label>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={handlePhotoClick}
                            disabled={uploadFileMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-[11px] font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50"
                          >
                            <Upload className="size-3.5" />
                            Change Photo
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                        {uploadFileMutation.isPending && (
                          <span className="text-[10px] text-[#0EA5E9] font-bold block animate-pulse">Uploading image file...</span>
                        )}
                      </div>
                    </div>

                    {/* Fields row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* First Name */}
                      <Input
                        label="First Name"
                        error={formState.errors['firstName']}
                        registration={register('firstName')}
                      />

                      {/* Last Name */}
                      <Input
                        label="Last Name"
                        error={formState.errors['lastName']}
                        registration={register('lastName')}
                      />

                      {/* Phone Number */}
                      <div className="sm:col-span-2">
                        <Input
                          label="Phone Number (10 digits)"
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          error={formState.errors['phoneNumber']}
                          registration={register('phoneNumber')}
                        />
                      </div>

                      {/* Email (Read Only) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 pl-1">Email Address (Read-only)</label>
                        <input
                          type="text"
                          value={user.data?.email || ''}
                          disabled
                          className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                        />
                      </div>

                      {/* Role Badge (Read Only) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 pl-1">Authority Role Badge</label>
                        <div className="flex h-10 items-center pl-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#1E3A8A]/10 text-[#1E3A8A] border border-blue-100 uppercase tracking-wide">
                            {roleString}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                )}
              </Form>
            )}

            {/* SECURITY TAB PANEL */}
            {activeTab === 'security' && (
              <Form
                schema={passwordFormSchema}
                onSubmit={handlePasswordSave}
                className="space-y-6"
              >
                {({ register, formState }) => (
                  <>
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800">Update Password</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Keep your account credentials secured</p>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                        error={formState.errors['oldPassword']}
                        registration={register('oldPassword')}
                      />

                      <Input
                        label="New Password"
                        type="password"
                        placeholder="Min. 6 characters"
                        error={formState.errors['newPassword']}
                        registration={register('newPassword')}
                      />

                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Re-enter password"
                        error={formState.errors['confirmPassword']}
                        registration={register('confirmPassword')}
                      />
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
                      >
                        Update Password
                      </button>
                    </div>
                  </>
                )}
              </Form>
            )}

            {/* ABOUT TAB PANEL */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800">About TaskFlow</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Information on application configuration and environment</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 max-w-md text-xs font-semibold text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Application Client</span>
                    <strong className="text-slate-800">TaskFlow Web Dashboard</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Build Version</span>
                    <strong className="text-[#0EA5E9]">v1.2.4</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Environment Mode</span>
                    <strong className="text-amber-600 uppercase">Production Staging</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Database Engine</span>
                    <strong className="text-slate-800">MongoDB Distributed Cluster</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>System Status</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
                      <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
                      All systems operational
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </ContentLayout>
  );
};

export default ProfileRoute;
