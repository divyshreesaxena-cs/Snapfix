const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const requestContext = require('./middleware/requestContext');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

dotenv.config();

const createApp = ({ connectDatabase = true } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  if (connectDatabase) {
    connectDB();
  }

  const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://snapfix-ebon.vercel.app/', // replace with your exact Vercel URL
];

app.use(requestContext);
app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/profile', require('./routes/profile'));
  app.use('/api/services', require('./routes/services'));
  app.use('/api/workers', require('./routes/workers'));
  app.use('/api/bookings', require('./routes/bookings'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/feedback', require('./routes/feedback'));
  app.use('/api/location', require('./routes/location'));
  app.use('/api/worker-auth', require('./routes/workerAuth'));
  app.use('/api/worker/profile', require('./routes/workerProfile'));
  app.use('/api/worker/bookings', require('./routes/workerBookings'));
  app.use('/api/admin-auth', require('./routes/adminAuth'));
  app.use('/api/admin', require('./routes/admin'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SnapFix API is running', requestId: req.requestId });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
