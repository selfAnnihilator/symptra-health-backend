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

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'symptrahealth'
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/orders', orderRoutes); // ADD THIS ROUTE
app.use('/api/analysis', analysisRoutes); // ADD THIS ROUTE
app.use('/api/faqs', faqRoutes); // ADD THIS ROUTE

app.get('/', (req, res) => {
  res.send({
    activeStatus:true,
    error:false,
  })
})

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
