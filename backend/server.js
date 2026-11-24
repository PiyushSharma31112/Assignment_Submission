import app from './app.js';
import { connectDatabase } from './config/database.js';
import { loadConfig } from './config/env.js';

async function startServer() {
  const { port } = loadConfig();
  await connectDatabase();
  app.listen(port, () => console.info(`AssignHub API listening on port ${port}.`));
}

startServer().catch((error) => {
  console.error(`Unable to start AssignHub API: ${error.message}`);
  process.exitCode = 1;
});
