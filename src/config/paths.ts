export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },

  auth: {

    login: {
      path: '/auth/login',
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },

  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    dashboard: {
      path: '',
      getHref: () => '/app',
    },
    users: {
      path: 'users',
      getHref: () => '/app/users',
    },
    createUser: {
      path: 'users/create',
      getHref: () => '/app/users/create',
    },
    editUser: {
      path: 'users/:userId',
      getHref: (id: string) => `/app/users/${id}`,
    },
    tasks: {
      path: 'tasks',
      getHref: () => '/app/tasks',
    },
    createTask: {
      path: 'tasks/create',
      getHref: () => '/app/tasks/create',
    },
    editTask: {
      path: 'tasks/:taskId',
      getHref: (id: string) => `/app/tasks/${id}`,
    },
    teams: {
      path: 'teams',
      getHref: () => '/app/teams',
    },
    reports: {
      path: 'reports',
      getHref: () => '/app/reports',
    },

    profile: {
      path: 'profile',
      getHref: () => '/app/profile',
    },

    changePassword: {
      path: 'change-password',
      getHref: () => '/app/change-password',
    },
  },
} as const;
