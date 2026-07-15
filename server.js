const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const articleRoutes = require('./routes/article.routes');
const requestRoutes = require('./routes/request.routes');
const orderRoutes = require('./routes/order.routes'); // IMPORT THIS
const analysisRoutes = require('./routes/analysis.routes'); // IMPORT THIS
const faqRoutes = require('./routes/faq.routes'); // IMPORT THIS
dotenv.config();

const app = express();
const mongoRetryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS) || 10000;
const mongoSelectionTimeoutMs = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000;
let mongoRetryTimer;

app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://symptra-health-frontend.vercel.app', // Replace with your actual Vercel URL
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up cookie options for cross-site requests
app.use((req, res, next) => {
  // This middleware helps handle cookies in cross-site requests
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

const scheduleMongoReconnect = () => {
  if (mongoRetryTimer) {
    return;
  }

  mongoRetryTimer = setTimeout(() => {
    mongoRetryTimer = undefined;
    connectToMongoDB();
  }, mongoRetryDelayMs);
  mongoRetryTimer.unref();
};

const connectToMongoDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB unavailable: MONGO_URI is not configured.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'symptrahealth',
      serverSelectionTimeoutMS: mongoSelectionTimeoutMs,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    scheduleMongoReconnect();
  }
};

mongoose.connection.on('disconnected', scheduleMongoReconnect);
connectToMongoDB();

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/health/ready', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ready' : 'not_ready',
    database: databaseReady ? 'connected' : 'disconnected',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    activeStatus: true,
    error: false,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable while the database reconnects.',
    });
  }

  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/orders', orderRoutes); // ADD THIS ROUTE
app.use('/api/analysis', analysisRoutes); // ADD THIS ROUTE
app.use('/api/faqs', faqRoutes); // ADD THIS ROUTE

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('API Error:', err.stack);
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${server.address().port}`);
});

module.exports = app;
