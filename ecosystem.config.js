module.exports = {
  apps: [
    {
      name: "smartlife",
      script: "node_modules/next/dist/bin/next",
      interpreter: "node",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
