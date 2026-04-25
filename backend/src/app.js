const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const worklogRoutes = require('./routes/worklogRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');

const errorMiddleware = require('./middleware/errorMiddleware');
const { connectToDatabase } = require('./config/database');
const { runMigrations } = require('./config/migrations');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route welcome
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to Vibe Flow API', 
    version: '1.0.0',
    documentation: '/api-docs (coming soon)'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/worklogs', worklogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error middleware
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectToDatabase();
    // Run project layer migrations on startup
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
