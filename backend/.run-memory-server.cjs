const { MongoMemoryServer } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');

async function main() {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.info(`Temporary MongoDB ready at ${uri}`);

  const backend = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname),
    env: { ...process.env, MONGODB_URI: uri },
    stdio: 'inherit',
  });

  const frontend = spawn('npm.cmd', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '..', 'frontend'),
    shell: true,
    stdio: 'inherit',
  });

  const shutdown = async () => {
    backend.kill();
    frontend.kill();
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
