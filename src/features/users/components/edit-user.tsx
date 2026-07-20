import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUploadFile } from '@/features/file/api/upload-file';

import { useGetUser } from '../api/get-user';
import {
  updateUserInputSchema,
  UpdateUserInput,
  useUpdateUser,
} from '../api/update-user';

const GENDER_LABELS: Record<number, string> = {
  0: 'Male',
  1: 'Female',
  2: 'Other',
};

type EditUserFormProps = {
  userId: string;
};

export const EditUserForm = ({ userId }: EditUserFormProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const userQuery = useGetUser({ userId });
  const uploadFileMutation = useUploadFile();

  const updateUserMutation = useUpdateUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'User Updated',
        });
        navigate(paths.app.users.getHref());
      },
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: (field: keyof UpdateUserInput, value: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFileMutation.mutateAsync({ file });
      setImageUrl(result.url);
      setValue('image', result.url);
    } catch {
      addNotification({ type: 'error', title: 'Image upload failed' });
    } finally {
      setUploading(false);
    }
  };

  if (userQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const userData = userQuery.data as any;
  if (!userData) {
    return (
      <div className="text-center text-gray-500 py-8">User not found</div>
    );
  }

  const userInfo = userData.userInfo || {};

  return (
    <div className="space-y-6 pb-10">
      {/* Read-only display fields */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">
          User Details (Read Only)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">User ID</span>
            <span className="block text-sm font-semibold text-slate-800 break-all">
              {userData._id}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Status</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              userData.status === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              userData.status === 1 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {userData.status === 0 ? 'Active' : userData.status === 1 ? 'Inactive' : 'Pending'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Email</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              userData.email?.isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {userData.email?.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Phone</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              userData.phoneNumber?.isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {userData.phoneNumber?.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
        </div>
        {/* Show current image */}
        {userInfo.image && (
          <div className="mt-6">
            <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Current Image</span>
            <img
              src={userInfo.image}
              alt="User"
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Editable form */}
      <Form
        id="edit-user"
        onSubmit={(values) => {
          updateUserMutation.mutate({ userId, data: values });
        }}
        schema={updateUserInputSchema}
        options={{
          defaultValues: {
            email: userData.email?.id || '',
            countryCode: userData.phoneNumber?.countryCode || '+91',
            phoneNumber: userData.phoneNumber?.number || '',
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            fatherName: userInfo.fatherName || '',
            motherName: userInfo.motherName || '',
            age: userInfo.age ?? ('' as unknown as number),
            gender: userInfo.gender ?? 0,
            salary: userInfo.salary ?? ('' as unknown as number),
            image: userInfo.image || '',
            role: userData.role ?? 4,
          } as UpdateUserInput,
        }}
      >
        {({ register, formState, setValue }) => (
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                  <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Personal Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <Input
                      label="First Name"
                      error={formState.errors['firstName']}
                      registration={register('firstName')}
                    />
                    <Input
                      label="Last Name"
                      error={formState.errors['lastName']}
                      registration={register('lastName')}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <Input
                      label="Father Name"
                      error={formState.errors['fatherName']}
                      registration={register('fatherName')}
                    />
                    <Input
                      label="Mother Name"
                      error={formState.errors['motherName']}
                      registration={register('motherName')}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <Input
                      label="Age"
                      type="number"
                      error={formState.errors['age']}
                      registration={register('age')}
                    />
                    <Input
                      label="Salary"
                      type="number"
                      error={formState.errors['salary']}
                      registration={register('salary')}
                    />
                  </div>
                  
                  <div>
                    <Select
                      label="Gender"
                      error={formState.errors['gender']}
                      registration={register('gender')}
                      defaultValue={String(userInfo.gender ?? 0)}
                      options={[
                        { label: 'Male', value: '0' },
                        { label: 'Female', value: '1' },
                        { label: 'Other', value: '2' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Account Details</h3>
                <div className="mb-4">
                  <Input
                    label="Email"
                    type="email"
                    error={formState.errors['email']}
                    registration={register('email')}
                  />
                </div>
                <div>
                  <Select
                    label="Role"
                    error={formState.errors['role']}
                    registration={register('role')}
                    defaultValue={String(userData.role ?? 4)}
                    options={[
                      { label: 'Employee', value: '4' },
                      { label: 'Team Lead', value: '2' },
                      { label: 'Manager', value: '1' },
                      { label: 'CEO', value: '0' },
                    ]}
                  />
                </div>
                </div>

                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Contact & Profile</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                    <Input
                      label="Country Code"
                      error={formState.errors['countryCode']}
                      registration={register('countryCode')}
                    />
                    <Input
                      label="Phone Number"
                      error={formState.errors['phoneNumber']}
                      registration={register('phoneNumber')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider ml-1">
                      Profile Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setValue as any)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {uploading && (
                      <p className="text-sm text-indigo-600 mt-2">Uploading...</p>
                    )}
                    {(imageUrl || userInfo.image) && (
                      <div className="mt-4">
                        <img
                          src={imageUrl || userInfo.image}
                          alt="Preview"
                          className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      </div>
                    )}
                    {(formState.errors as any)['image'] && (
                      <p className="mt-2 text-sm text-red-600">
                        {(formState.errors as any)['image']?.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => navigate(paths.app.users.getHref())}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full px-6"
                isLoading={updateUserMutation.isPending}
              >
                Update User
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};
