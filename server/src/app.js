import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import recordRoutes from './routes/record.routes.js';
import userRoutes from './routes/user.routes.js';
import meRoutes from './routes/me.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
}));

app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', authRoutes);
app.use('/api', patientRoutes);
app.use('/api', recordRoutes);
app.use('/api', userRoutes);
app.use('/api', meRoutes);
app.use('/api', dashboardRoutes);


export default app;
