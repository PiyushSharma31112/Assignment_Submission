import 'dotenv/config';

export function loadConfig() {
  const { MONGODB_URI, JWT_SECRET } = process.env;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters.');
  }

  return {
    mongoUri: MONGODB_URI,
    jwtSecret: JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
