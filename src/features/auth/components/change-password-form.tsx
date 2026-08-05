import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

import {
  changePasswordInputSchema,
  useChangePassword,
} from '../api/change-password';

export const ChangePasswordForm = () => {
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Password Changed Successfully',
        });
        navigate(paths.app.profile.getHref());
      },
    },
  });

  return (
    <Form
      onSubmit={(values) => {
        changePasswordMutation.mutate({ data: values });
      }}
      options={{
        defaultValues: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        },
      }}
      schema={changePasswordInputSchema}
    >
      {({ register, formState }) => (
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              error={formState.errors['oldPassword']}
              registration={register('oldPassword')}
              className="h-11 rounded-full px-5"
            />
            <Input
              type="password"
              label="New Password"
              error={formState.errors['newPassword']}
              registration={register('newPassword')}
              className="h-11 rounded-full px-5"
            />
            <Input
              type="password"
              label="Confirm Password"
              error={formState.errors['confirmPassword']}
              registration={register('confirmPassword')}
              className="h-11 rounded-full px-5"
            />
          </div>

          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              isLoading={changePasswordMutation.isPending}
              className="w-full rounded-full bg-indigo-600 px-8 text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg sm:w-auto"
            >
              Change Password
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
};
