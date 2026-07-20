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
              className="rounded-full h-12 px-6 bg-transparent"
            />
            <div className="space-y-2">
              <Input
                type="password"
                label=""
                placeholder="Password"
                error={formState.errors['password']}
                registration={register('password')}
                className="rounded-full h-12 px-6 bg-transparent"
              />
            </div>
            <div className="pt-4">
              <Button
                isLoading={login.isPending}
                type="submit"
                className="w-full rounded-full h-12 shadow-lg bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white transition-all hover:scale-[1.02] text-base font-medium"
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
