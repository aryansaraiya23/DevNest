import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { SUPPORTED_LANGUAGES } from '@devnest/shared';
import { env } from './config/env';
import { connectDatabase, setupDatabaseGracefulShutdown } from './config/db';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

const app = express();

// CORS — must come before routes; allow credentials for cookie-based auth
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'devnest-server',
    timestamp: new Date().toISOString(),
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
  });
});

// Start server (not during tests — tests import app directly)
if (env.NODE_ENV !== 'test') {
  connectDatabase(env.MONGODB_URI)
    .then(() => {
      setupDatabaseGracefulShutdown();
      app.listen(env.PORT, () => {
        console.log(`[DevNest Engine] Server running on http://localhost:${env.PORT}`);
      });
    })
    .catch((err) => {
      console.error('[Startup] Failed to connect to database. Server will not start.', err);
      process.exit(1);
    });
}

export default app;
