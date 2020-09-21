module.exports = {
  apps: [
    {
      name: 'garpun',
      script: './app.js',
      watch: true,
      ignore_watch: ['[/\\]./', 'node_modules', 'logs', 'db'],
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
