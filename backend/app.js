import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { loadConfig } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import HttpError from './utils/HttpError.js';

const config = loadConfig();
const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && origin !== config.frontendUrl && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next(new HttpError(403, 'Request origin is not allowed.'));
  }
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/assignments', requireAuth, assignmentRoutes);
app.use('/api/submissions', requireAuth, submissionRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
