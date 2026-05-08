module.exports = {
  apps: [
    {
      name: 'uom-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start:prod',
      env: {
        NODE_ENV: 'production',
        PORT: 8888,
      },
    },
    {
      name: 'uom-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },
    },
  ],
};
