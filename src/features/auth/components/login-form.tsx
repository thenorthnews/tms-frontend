import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { useLogin, loginInputSchema } from '@/lib/auth';

type LoginFormProps = {
  onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const login = useLogin({
    onSuccess,
  });

  return (
    <div>
      <Form
        onSubmit={(values) => {
          login.mutate(values);
        }}
        schema={loginInputSchema}
      >
        {({ register, formState }) => (
          <div className="space-y-6">
            <Input
              type="email"
              label=""
              placeholder="Email or Username"
              error={formState.errors['email']}
              registration={register('email')}
              className="h-12 rounded-full bg-transparent px-6"
            />
            <div className="space-y-2">
              <Input
                type="password"
                label=""
                placeholder="Password"
                error={formState.errors['password']}
                registration={register('password')}
                className="h-12 rounded-full bg-transparent px-6"
              />
            </div>
            <div className="pt-4">
              <Button
                isLoading={login.isPending}
                type="submit"
                className="h-12 w-full rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-base font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:from-orange-600 hover:via-pink-600 hover:to-purple-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};
