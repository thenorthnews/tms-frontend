import {
  User,
  Lock,
  Info,
  LogOut,
  Upload,
  Check,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import * as React from 'react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { ContentLayout } from '@/components/layouts';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useChangePassword } from '@/features/auth/api/change-password';
import { useUpdateProfile } from '@/features/auth/api/update-profile';
import { useUploadFile } from '@/features/file/api/upload-file';
import { useUser, useLogout } from '@/lib/auth';

const profileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  image: z.string().optional(),
});

const passwordFormSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, 'Current password must be at least 6 characters'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

const ProfileRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const logout = useLogout();
  const { addNotification } = useNotifications();

  // --- ACTIVE TAB ---
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'about'>(
    'account',
  );

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
      onError: (err: { message?: string }) => {
        addNotification({
          type: 'error',
          title: 'Failed to update password',
          message: err.message || 'Verification error.',
        });
      },
    },
  });

  const getPhoneStr = (p: unknown) => {
    if (!p) return '';
    if (typeof p === 'string') return p.replace(/\D/g, '').slice(0, 10);
    if (typeof p === 'object' && p !== null) {
      const pObj = p as Record<string, unknown>;
      const num = pObj.number || pObj.phoneNumber || pObj.phone || '';
      return typeof num === 'string'
        ? num.replace(/\D/g, '').slice(0, 10)
        : String(num || '');
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
        <div className="flex flex-col items-center gap-2 py-12 text-center font-bold text-red-500">
          <ShieldAlert className="size-8" />
          Please log in to view settings
        </div>
      </ContentLayout>
    );
  }

  const getRoleString = (r: unknown) => {
    if (r === 0 || r === 'CEO') return 'CEO';
    if (r === 1 || r === 'Manager') return 'Manager';
    if (r === 2 || r === 'Team Lead') return 'Team Lead';
    if (r === 4 || r === 'Employee') return 'Employee';
    return String(r ?? '');
  };

  const role = user.data.role;
  const roleString = getRoleString(role);
  const isEmployee =
    typeof role === 'number'
      ? role === 4
      : String(role).toLowerCase() === 'employee';

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
        setProfileData((prev) => ({ ...prev, image: response.url }));
        // Save automatically
        updateProfileMutation.mutate({
          data: {
            ...profileData,
            image: response.url,
          },
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
      <div className="mx-auto w-full max-w-5xl pb-12 duration-500 animate-in fade-in">
        <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:flex-row">
          {/* LEFT: Tab Navigation */}
          <div className="flex w-full select-none flex-col justify-between border-r border-slate-100 bg-slate-50/50 p-5 lg:w-64">
            {/* Nav list */}
            <div className="space-y-1">
              {/* Horizontal Scroll wrapper for mobile viewport, standard column layout for desktop */}
              <div className="flex gap-2 overflow-x-auto border-b border-slate-200/50 pb-2 lg:flex-col lg:overflow-x-visible lg:border-b-0 lg:pb-0">
                {/* Account tab */}
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    activeTab === 'account'
                      ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                  }`}
                >
                  <User className="size-4" />
                  Account Profile
                </button>

                {/* Security tab */}
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    activeTab === 'security'
                      ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                  }`}
                >
                  <Lock className="size-4" />
                  Security Lock
                </button>

                {/* About tab */}
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    activeTab === 'about'
                      ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                  }`}
                >
                  <Info className="size-4" />
                  About TaskFlow
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Content panel */}
          <div className="flex-1 bg-white p-6 text-left sm:p-10">
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
                      <h3 className="text-lg font-bold text-slate-800">
                        Account Details
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Manage your personal details and avatar preferences
                      </p>
                    </div>

                    {/* Avatar and file upload */}
                    <div className="gap-4.5 flex flex-col items-center border-b border-slate-50 pb-5 sm:flex-row">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner">
                        {profileData.image ? (
                          <img
                            src={profileData.image}
                            alt="Avatar"
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-bold text-slate-400">
                            {profileData.firstName?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-center sm:text-left">
                        <label className="block text-xs font-bold text-slate-700">
                          Avatar Photo
                        </label>
                        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                          <button
                            type="button"
                            onClick={handlePhotoClick}
                            disabled={uploadFileMutation.isPending}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2 text-[11px] font-bold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50"
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
                          <span className="block animate-pulse text-[10px] font-bold text-[#0EA5E9]">
                            Uploading image file...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fields row */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <label className="block pl-1 text-xs font-bold text-slate-400">
                          Email Address (Read-only)
                        </label>
                        <input
                          type="text"
                          value={user.data?.email || ''}
                          disabled
                          className="block w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400"
                        />
                      </div>

                      {/* Role Badge (Read Only) */}
                      <div className="space-y-1.5">
                        <label className="block pl-1 text-xs font-bold text-slate-400">
                          Authority Role Badge
                        </label>
                        <div className="flex h-10 items-center pl-2">
                          <span className="inline-flex items-center rounded-full border border-blue-100 bg-[#1E3A8A]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1E3A8A]">
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
                        className="cursor-pointer rounded-xl bg-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#152a63] disabled:opacity-50"
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
                      <h3 className="text-lg font-bold text-slate-800">
                        Update Password
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Keep your account credentials secured
                      </p>
                    </div>

                    <div className="max-w-md space-y-4">
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
                        className="cursor-pointer rounded-xl bg-[#1E3A8A] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#152a63] disabled:opacity-50"
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
                  <h3 className="text-lg font-bold text-slate-800">
                    About TaskFlow
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Information on application configuration and environment
                  </p>
                </div>

                <div className="max-w-md space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span>Application Client</span>
                    <strong className="text-slate-800">
                      TaskFlow Web Dashboard
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span>Build Version</span>
                    <strong className="text-[#0EA5E9]">v1.2.4</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span>Environment Mode</span>
                    <strong className="uppercase text-amber-600">
                      Production Staging
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1">
                    <span>Database Engine</span>
                    <strong className="text-slate-800">
                      MongoDB Distributed Cluster
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>System Status</span>
                    <span className="flex items-center gap-1.5 font-extrabold text-emerald-600">
                      <span className="size-2 animate-ping rounded-full bg-emerald-500" />
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
