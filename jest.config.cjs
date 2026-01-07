// jest.config.cjs

/** @type {import("jest").Config} **/
const config = {
  // 👈 ts-jest의 ESM 프리셋 사용을 명확히 지정
  preset: 'ts-jest/presets/default-esm',

  testEnvironment: 'node',

  // 테스트 파일 패턴 지정
  testMatch: ['**/src/**/*.test.ts', '**/src/**/__tests__/**/*.test.ts'],

  // 테스트에서 제외할 경로
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$'],

  // 이전에 추가했던 설정들은 유지합니다.
  moduleNameMapper: {
    // .js 확장자를 .ts로 매핑하여 모듈 로드 오류 해결
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    // node_modules만 무시하고 나머지는 ts-jest가 변환하도록 강제
    '/node_modules/',
  ],
};

module.exports = config;
