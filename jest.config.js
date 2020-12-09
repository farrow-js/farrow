module.exports = {
  transform: {
    '.(ts|tsx|js|jsx)': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coveragePathIgnorePatterns: ['/example/', '/node_modules/', '/__tests__/'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  collectCoverageFrom: ['packages/*/src/**/*.{js,ts,tsx}'],
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  moduleNameMapper: {},
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
}
