import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useUser } from '@/lib/auth';
import { useUploadFile } from '@/features/file/api/upload-file';
import { UseFormSetValue } from 'react-hook-form';
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
      onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
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
    setValue: UseFormSetValue<UpdateProfileInput>
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
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-6 mb-6">
              <div className="size-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="size-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setValue as unknown as UseFormSetValue<UpdateProfileInput>)}
                  disabled={uploadFileMutation.isPending}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {uploadFileMutation.isPending && <span className="text-xs text-indigo-600 animate-pulse font-medium">Uploading image...</span>}
                {formState.errors['image'] && (
                  <p className="text-xs text-red-600 mt-1">
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
                className="rounded-full h-11 px-5"
              />
              <Input
                label="Last Name"
                error={formState.errors['lastName']}
                registration={register('lastName')}
                className="rounded-full h-11 px-5"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 pl-2">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={user.data?.email ?? ''}
                  className="block w-full rounded-full border-gray-200 bg-gray-50 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-11 px-5 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 pl-2">
                  Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user.data?.role ?? ''}
                  className="block w-full rounded-full border-gray-200 bg-gray-50 text-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-11 px-5 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <Button
                type="submit"
                isLoading={updateProfileMutation.isPending}
                className="w-full sm:w-auto rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:shadow-lg"
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
