import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { UseFormSetValue } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUploadFile } from '@/features/file/api/upload-file';

import {
  createUserInputSchema,
  CreateUserInput,
  useCreateUser,
} from '../api/create-user';

export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2,
}

export const CreateUserForm = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadFileMutation = useUploadFile();

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'User Created',
        });
        navigate(paths.app.users.getHref());
      },
    },
  });

  const handleImageUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<CreateUserInput>,
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
  }, [uploadFileMutation, addNotification]);

  return (
    <Form
      id="create-user"
      onSubmit={(values) => {
        createUserMutation.mutate({ data: values });
      }}
      schema={createUserInputSchema}
      options={{
        defaultValues: {
          email: '',
          password: '',
          countryCode: '+91',
          phoneNumber: '',
          firstName: '',
          lastName: '',
          fatherName: '',
          motherName: '',
          age: '' as unknown as number,
          gender: Gender.MALE,
          image: '',
          role: 4,
        },
      }}
    >
      {({ register, formState, setValue }) => (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Personal Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <Input label="First Name" error={formState.errors['firstName']} registration={register('firstName')} />
                  <Input label="Last Name" error={formState.errors['lastName']} registration={register('lastName')} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <Input label="Father Name" error={formState.errors['fatherName']} registration={register('fatherName')} />
                  <Input label="Mother Name" error={formState.errors['motherName']} registration={register('motherName')} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <Input label="Age" type="number" error={formState.errors['age']} registration={register('age')} />
                </div>
                <div>
                  <Select
                    label="Gender"
                    error={formState.errors['gender']}
                    registration={register('gender')}
                    options={[
                      { label: 'Male', value: String(Gender.MALE) },
                      { label: 'Female', value: String(Gender.FEMALE) },
                      { label: 'Other', value: String(Gender.OTHER) },
                    ]}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Account Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <Input label="Email" type="email" error={formState.errors['email']} registration={register('email')} />
                  <Input label="Password" type="password" error={formState.errors['password']} registration={register('password')} />
                </div>
                <div>
                  <Select
                    label="Role"
                    error={formState.errors['role']}
                    registration={register('role')}
                    options={[
                      { label: 'Employee', value: '4' },
                      { label: 'Team Lead', value: '2' },
                      { label: 'Manager', value: '1' },
                    ]}
                  />
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 mb-5 uppercase tracking-wide ml-1">Contact & Profile</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                  <Input label="Country Code" error={formState.errors['countryCode']} registration={register('countryCode')} />
                  <Input label="Phone Number" error={formState.errors['phoneNumber']} registration={register('phoneNumber')} />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider ml-1">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setValue as any)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploading && <p className="text-sm text-indigo-600 mt-2">Uploading...</p>}
                  {imageUrl && (
                    <div className="mt-4">
                      <img src={imageUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-sm" />
                    </div>
                  )}
                  {formState.errors['image'] && <p className="mt-2 text-sm text-red-600">{formState.errors['image']?.message}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => navigate(paths.app.users.getHref())}>Cancel</Button>
            <Button type="submit" className="rounded-full px-6" isLoading={createUserMutation.isPending}>Create User</Button>
          </div>
        </div>
      )}
    </Form>
  );
};
