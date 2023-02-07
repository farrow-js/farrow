const path = require('path')

module.exports = {
  cacheDirectory: path.join(__dirname, 'node_modules/.jest-cache'),
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/*.|\\.(test|spec))\\.(ts|tsx|js|jsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coveragePathIgnorePatterns: ['/examples/', '/node_modules/', '/__tests__/'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  rootDir: __dirname,
  moduleNameMapper: {},
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
}
