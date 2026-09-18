import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler.js';

import authRoutes from './routes/auth.js';
import spaceRoutes from './routes/spaces.js';
import projectRoutes from './routes/projects.js';
import documentRoutes from './routes/documents.js';
import tutorRoutes from './routes/tutor.js';
import quizRoutes from './routes/quizzes.js';
import masteryRoutes from './routes/mastery.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow configured CORS origin or wildcard in production if set
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check endpoints for hosting providers (Render/Railway/Vercel)
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
app.get('/', (_req, res) => res.status(200).json({ message: 'AI Study Companion API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api', projectRoutes); // Has /spaces/:spaceId/projects and /projects/:id
app.use('/api', documentRoutes); // Has /projects/:projectId/documents etc.
app.use('/api', tutorRoutes);
app.use('/api', quizRoutes);
app.use('/api', masteryRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
