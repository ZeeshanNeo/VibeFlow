/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced record not found';
  }

  // Oracle database errors
  if (err.errorNum) {
    switch (err.errorNum) {
      case 1: // Unique constraint violation
        statusCode = 409;
        message = 'Duplicate entry';
        break;
      case 2291: // Foreign key constraint violation
        statusCode = 400;
        message = 'Referenced record not found';
        break;
      case 1400: // NOT NULL constraint violation
        statusCode = 400;
        message = 'Required field missing';
        break;
      default:
        // Keep default status and message
        break;
    }
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorMiddleware;