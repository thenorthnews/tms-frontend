import { UseFormSetValue } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useUploadFile } from '@/features/file/api/upload-file';
import { useUser } from '@/lib/auth';

import {
  updateProfileInputSchema,
  UpdateProfileInput,
  useUpdateProfile,
} from '../api/update-profile';

export const UpdateProfileForm = () => {
  const user = useUser();
  const { addNotification } = useNotifications();
  const updateProfileMutation = useUpdateProfile({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Profile Updated',
        });
      },
    },
  });

  const uploadFileMutation = useUploadFile({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Image uploaded successfully',
        });
      },
      onError: (error: {
        response?: { data?: { message?: string } };
        message?: string;
      }) => {
        const message = error.response?.data?.message || error.message;
        addNotification({
          type: 'error',
          title: 'Image upload failed',
          message,
        });
      },
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<UpdateProfileInput>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFileMutation.mutateAsync({ file });
      if (response?.url) {
        setValue('image', response.url);
      }
    } catch (error) {
      console.error('Image upload failed', error);
    }
  };

  if (!user.data) return null;

  return (
    <Form
      onSubmit={(values) => {
        updateProfileMutation.mutate({ data: values });
      }}
      options={{
        defaultValues: {
          firstName: user.data?.firstName ?? '',
          lastName: user.data?.lastName ?? '',
          image: user.data?.image ?? '',
        },
      }}
      schema={updateProfileInputSchema}
    >
      {({ register, formState, setValue, watch }) => {
        const imageUrl = watch('image');
        return (
          <div className="space-y-6">
            <div className="mb-6 flex flex-col items-center gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-400">No Image</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(
                      e,
                      setValue as unknown as UseFormSetValue<UpdateProfileInput>,
                    )
                  }
                  disabled={uploadFileMutation.isPending}
                  className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {uploadFileMutation.isPending && (
                  <span className="animate-pulse text-xs font-medium text-indigo-600">
                    Uploading image...
                  </span>
                )}
                {formState.errors['image'] && (
                  <p className="mt-1 text-xs text-red-600">
                    {formState.errors['image']?.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="First Name"
                error={formState.errors['firstName']}
                registration={register('firstName')}
                className="h-11 rounded-full px-5"
              />
              <Input
                label="Last Name"
                error={formState.errors['lastName']}
                registration={register('lastName')}
                className="h-11 rounded-full px-5"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block pl-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={user.data?.email ?? ''}
                  className="block h-11 w-full rounded-full border-gray-200 bg-gray-50 px-5 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block pl-2 text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user.data?.role ?? ''}
                  className="block h-11 w-full rounded-full border-gray-200 bg-gray-50 px-5 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <Button
                type="submit"
                isLoading={updateProfileMutation.isPending}
                className="w-full rounded-full bg-indigo-600 px-8 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg sm:w-auto"
              >
                Update Profile
              </Button>
            </div>
          </div>
        );
      }}
    </Form>
  );
};
