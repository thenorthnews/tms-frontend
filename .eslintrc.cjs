module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: [
    'node_modules/*',
    'public/mockServiceWorker.js',
    'generators/*',
  ],
  extends: ['eslint:recommended'],
  plugins: ['check-file'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      settings: {
        react: { version: 'detect' },
        'import/resolver': {
          typescript: {},
        },
      },
      env: {
        browser: true,
        node: true,
        es6: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
        'plugin:testing-library/react',
        'plugin:jest-dom/recommended',
        'plugin:tailwindcss/recommended',
        'plugin:vitest/legacy-recommended',
      ],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              // Feature isolation rules with allowed shared cross-feature dependencies:
              {
                target: './src/features/auth',
                from: './src/features',
                except: ['./auth', './file'],
              },
              {
                target: './src/features/users',
                from: './src/features',
                except: ['./users', './file'],
              },
              {
                target: './src/features/teams',
                from: './src/features',
                except: ['./teams', './users', './tasks'],
              },
              {
                target: './src/features/tasks',
                from: './src/features',
                except: ['./tasks', './file', './users', './clients'],
              },
              {
                target: './src/features/dashboard',
                from: './src/features',
                except: [
                  './dashboard',
                  './tasks',
                  './users',
                  './clients',
                  './teams',
                  './reports',
                ],
              },
              // enforce unidirectional codebase:

              // e.g. src/app can import from src/features but not the other way around
              {
                target: './src/features',
                from: './src/app',
              },

              // e.g src/features and src/app can import from these shared modules but not the other way around
              {
                target: [
                  './src/components',
                  './src/hooks',
                  './src/lib',
                  './src/types',
                  './src/utils',
                ],
                from: ['./src/features', './src/app'],
              },
            ],
          },
        ],
        'import/no-cycle': 'error',
        'linebreak-style': ['error', 'unix'],
        'react/prop-types': 'off',
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
            ],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import/default': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-named-as-default': 'error',
        'react/react-in-jsx-scope': 'off',
        'jsx-a11y/anchor-is-valid': 'warn',
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/explicit-function-return-type': ['warn'],
        '@typescript-eslint/explicit-module-boundary-types': ['warn'],
        '@typescript-eslint/no-empty-function': ['warn'],
        '@typescript-eslint/no-explicit-any': ['error'],
        'prettier/prettier': ['error', {}, { usePrettierrc: true }],
        'check-file/filename-naming-convention': [
          'error',
          {
            '**/*.{ts,tsx}': 'KEBAB_CASE',
          },
          {
            ignoreMiddleExtensions: true,
          },
        ],
      },
    },
    {
      plugins: ['check-file'],
      files: ['src/**/!(__tests__)/*'],
      rules: {
        'check-file/folder-naming-convention': [
          'error',
          {
            '**/*': 'KEBAB_CASE',
          },
        ],
      },
    },
  ],
};
