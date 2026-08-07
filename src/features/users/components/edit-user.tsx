import { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useUploadFile } from '@/features/file/api/upload-file';

import { useGetUser } from '../api/get-user';
import {
  updateUserInputSchema,
  UpdateUserInput,
  useUpdateUser,
} from '../api/update-user';

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
          title: 'User Details Updated Successfully',
        });
        navigate(-1);
      },
      onError: (err: {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      }) => {
        const backendMsg =
          err.response?.data?.message || err.message || 'Failed to update user';
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: backendMsg,
        });
      },
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<UpdateUserInput>,
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

  const userData = userQuery.data;
  if (!userData) {
    return <div className="py-8 text-center text-gray-500">User not found</div>;
  }

  const userInfo = userData.userInfo || {};

  const defaultValues: UpdateUserInput = {
    email:
      typeof userData.email === 'string'
        ? userData.email
        : String(userData.email || ''),
    countryCode:
      typeof userData.phoneNumber === 'object' && userData.phoneNumber !== null
        ? userData.phoneNumber.countryCode || '+91'
        : '+91',
    phoneNumber:
      typeof userData.phoneNumber === 'object' && userData.phoneNumber !== null
        ? userData.phoneNumber.number || ''
        : typeof userData.phoneNumber === 'string'
          ? userData.phoneNumber
          : '',
    firstName: userData.firstName || userInfo.firstName || '',
    lastName: userData.lastName || userInfo.lastName || '',
    gender: userData.gender ?? userInfo.gender ?? 0,
    department: userData.department || 'Engineering',
    image: userData.image || userInfo.image || '',
    role: Number(userData.role ?? 4),
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Editable form */}
      <Form
        id="edit-user"
        key={`${userData._id}-${userData.firstName || userInfo.firstName || ''}-${userData.lastName || userInfo.lastName || ''}-${userData.department || ''}`}
        onSubmit={(values) => {
          updateUserMutation.mutate({ userId, data: values });
        }}
        schema={updateUserInputSchema}
        options={{
          defaultValues,
        }}
      >
        {({ register, formState, setValue }) => (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="h-full rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                  <h3 className="mb-5 ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Personal Details
                  </h3>
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  <div>
                    <Select
                      label="Gender"
                      error={formState.errors['gender']}
                      registration={register('gender')}
                      defaultValue={String(
                        userData.gender ?? userInfo.gender ?? 0,
                      )}
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
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                  <h3 className="mb-5 ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account Details
                  </h3>
                  <div className="mb-4">
                    <Input
                      label="Email"
                      type="email"
                      error={formState.errors['email']}
                      registration={register('email')}
                    />
                  </div>
                  <div className="mb-4">
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
                  <div>
                    <Select
                      label="Department"
                      error={formState.errors['department']}
                      registration={register('department')}
                      defaultValue={userData.department || 'Engineering'}
                      options={[
                        { label: 'Engineering', value: 'Engineering' },
                        { label: 'Marketing', value: 'Marketing' },
                        { label: 'Sales', value: 'Sales' },
                        { label: 'Human Resources', value: 'Human Resources' },
                        { label: 'Design', value: 'Design' },
                        { label: 'Operations', value: 'Operations' },
                      ]}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                  <h3 className="mb-5 ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact & Profile
                  </h3>
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <label htmlFor="edit-user-image-upload" className="mb-3 ml-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Profile Image
                    </label>
                    <input
                      id="edit-user-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setValue)}
                      className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploading && (
                      <p className="mt-2 text-sm text-indigo-600">
                        Uploading...
                      </p>
                    )}
                    {(imageUrl || userInfo.image) && (
                      <div className="mt-4">
                        <img
                          src={imageUrl || userInfo.image}
                          alt="Preview"
                          className="size-20 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      </div>
                    )}
                    {formState.errors.image && (
                      <p className="mt-2 text-sm text-red-600">
                        {formState.errors.image.message}
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
                onClick={() => navigate(-1)}
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
