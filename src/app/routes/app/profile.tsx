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

  // --- LOCAL FORMS STATE ---
  const [profileData, setProfileData] = useState({
    firstName: user.data?.firstName || '',
    lastName: user.data?.lastName || '',
    fatherName: user.data?.fatherName || '',
    motherName: user.data?.motherName || '',
    image: user.data?.image || '',
  });

  // Keep state updated when user details finish loading
  React.useEffect(() => {
    if (user.data) {
      setProfileData({
        firstName: user.data.firstName || '',
        lastName: user.data.lastName || '',
        fatherName: user.data.fatherName || '',
        motherName: user.data.motherName || '',
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
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ data: profileData });
  };

  // Submit change password
  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Validation failed',
        message: "New passwords don't match.",
      });
      return;
    }
    changePasswordMutation.mutate({ data: pwdData });
  };

  // Logout trigger
  const handleLogoutClick = () => {
    if (confirm('Are you sure you want to log out of your session?')) {
      logout.mutate(undefined);
    }
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'account'
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'security'
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === 'about'
                      ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  <Info className="size-4" />
                  About TaskFlow
                </button>

              </div>
            </div>

            {/* Logout button (Desktop position - hidden on mobile, placed inside content cards on small screens) */}
            <div className="hidden lg:block pt-6 border-t border-slate-200/50">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-rose-100 hover:border-rose-200 text-rose-500 hover:bg-rose-50/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
                Log Out
              </button>
            </div>

          </div>

          {/* RIGHT: Content panel */}
          <div className="flex-1 p-6 sm:p-10 bg-white text-left">
            
            {/* ACCOUNT TAB PANEL */}
            {activeTab === 'account' && (
              <form onSubmit={handleProfileSave} className="space-y-6">
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
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                      required
                    />
                  </div>

                  {/* Father Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">Father's Name</label>
                    <input
                      type="text"
                      value={profileData.fatherName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fatherName: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                    />
                  </div>

                  {/* Mother Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">Mother's Name</label>
                    <input
                      type="text"
                      value={profileData.motherName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, motherName: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                    />
                  </div>

                  {/* Email (Read Only) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 pl-1">Email Address (Read-only)</label>
                    <input
                      type="text"
                      value={user.data.email}
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
              </form>
            )}



            {/* SECURITY TAB PANEL */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSave} className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800">Update Password</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Keep your account credentials secured</p>
                </div>

                <div className="space-y-4 max-w-md">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">Current Password</label>
                    <input
                      type="password"
                      value={pwdData.oldPassword}
                      onChange={(e) => setPwdData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">New Password</label>
                    <input
                      type="password"
                      value={pwdData.newPassword}
                      onChange={(e) => setPwdData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                      placeholder="Min. 6 characters"
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 pl-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwdData.confirmPassword}
                      onChange={(e) => setPwdData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E3A8A] text-slate-800"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
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
              </form>
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

            {/* Logout button (Mobile view position - shown inside content section for small viewports) */}
            <div className="mt-8 pt-6 border-t border-slate-100 lg:hidden">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-rose-100 text-rose-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
                Log Out
              </button>
            </div>

          </div>

        </div>
      </div>
    </ContentLayout>
  );
};

export default ProfileRoute;
