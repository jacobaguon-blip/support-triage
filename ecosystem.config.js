module.exports = {
  apps: [
    {
      name: 'triage-api',
      script: 'server.js',
      cwd: './ui',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    },
    {
      name: 'triage-ui',
      script: 'npx',
      args: 'vite --port 3000',
      cwd: './ui',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
