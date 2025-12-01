// eslint.config.js
import globals from 'globals';
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default [
  // 1. 기본 ESLint 규칙 적용 (필수)
  js.configs.recommended,

  // 2. 실행 환경 및 전역 변수 설정
  {
    languageOptions: {
      globals: {
        ...globals.browser, // 브라우저 환경 (window, document 등)
        ...globals.node, // Node.js 환경 (process, require 등)
      },
      // ECMAScript 버전 및 모듈 타입 설정
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    // 3. 무시할 파일 설정 (이전의 .eslintignore 역할)
    // node_modules 폴더와 빌드 결과물 폴더 등은 여기에 명시합니다.
    ignores: ['node_modules/', 'dist/', 'build/', '**/*.min.js', 'prisma/'],
  },

  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // 또는 './tsconfig.json' 파일 경로
      },
    },
  },

  // 4. Prettier 통합 설정
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // Prettier 규칙을 ESLint 규칙으로 추가
      'prettier/prettier': 'error',
    },
  },

  // 5. eslint-config-prettier 적용 (포맷팅 규칙 충돌 방지)
  // 🚨 중요: 반드시 모든 스타일 가이드 설정 뒤에 마지막으로 와야 합니다.
  prettierConfig,
];
