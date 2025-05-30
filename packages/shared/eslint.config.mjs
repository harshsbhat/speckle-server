import { baseConfigs, globals, getESMDirname } from '../../eslint.config.mjs'
import tseslint from 'typescript-eslint'

/**
 * @type {Array<import('eslint').Linter.FlatConfig>}
 */
const configs = [
  ...baseConfigs,
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    ignores: ['**/html/**']
  },
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: [...(c.files || []), '**/*.ts', '**/*.d.ts']
  })),
  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: getESMDirname(import.meta.url),
        projectService: {
          allowDefaultProject: ['*.ts']
        }
      }
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off' // to restrictive
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off' // so we can easily make sync mocked loaders -> async
    }
  }
]

export default configs
