const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Database Connection
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/buildings', require('./routes/buildingRoutes'));
app.use('/api/apartments', require('./routes/apartmentRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));


// Serve React Admin Frontend Statically in Production
app.get('/admin', (req, res) => {
  res.redirect('/admin/');
});
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/dist', 'index.html'));
});

// Default server root message
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CHDV 360 Plus Backend Server API is running.'
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Listen
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
