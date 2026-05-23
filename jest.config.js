process.env.SUPPRESS_STRICTNESS_CHECK = 'true';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.js'],
  forceExit: true,
  detectOpenHandles: true
};

