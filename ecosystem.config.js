module.exports = {
  apps: [
    {
      name: 'uom-backend',
      cwd: './backend',
      script: 'main.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 8888,
      },
    },
    {
      name: 'uom-frontend',
      cwd: './frontend',
      script: 'scripts/start-standalone.mjs',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },
    },
  ],
};
