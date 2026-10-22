import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SUPPORTED_LANGUAGES } from '@devnest/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'devnest-server',
    timestamp: new Date().toISOString(),
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[DevNest Engine] Server running on http://localhost:${PORT}`);
  });
}

export default app;
