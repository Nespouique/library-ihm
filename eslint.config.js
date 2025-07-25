import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
    {
        // Files and directories to ignore
        ignores: [
            'dist/',
            'node_modules/',
            '.env',
            '.env.local',
            '.env.development.local',
            '.env.test.local',
            '.env.production.local',
            '*.log',
            'coverage/',
            '.nyc_output/',
            'build/',
        ],
    },
    {
        languageOptions: {
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                // Node.js globals for build tools
                process: 'readonly',
                // ES2021 globals
                globalThis: 'readonly',
            },
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            // ES6+
            'no-duplicate-imports': 'error',
            // Best practices
            'no-unused-vars': [
                'warn', // Changed to warn instead of error
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    args: 'after-used',
                },
            ],
            'prefer-const': 'error',
            eqeqeq: 'error',
        },
    },
    {
        // Test files configuration
        files: [
            'test/**/*.mjs',
            'test/**/*.js',
            '**/*.test.jsx',
            '**/*.test.js',
        ],
        languageOptions: {
            globals: {
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
                vi: 'readonly', // For Vitest
                it: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'off', // More flexible for test files
        },
    },
    {
        // React/JSX specific configuration
        files: ['**/*.jsx', '**/*.tsx'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        languageOptions: {
            globals: {
                React: 'readonly',
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React specific rules
            'react/jsx-uses-react': 'error',
            'react/jsx-uses-vars': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
    // Apply Prettier config to disable conflicting rules
    prettierConfig,
];
