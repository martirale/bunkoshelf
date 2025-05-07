module.exports = {
  apps: [
    {
      name: "express-backend",
      script: "./back/server.js",
      watch: false,
    },
    {
      name: "next-frontend",
      cwd: "./front",
      script: "pnpm",
      args: "start",
      watch: false,
    },
  ],
};
