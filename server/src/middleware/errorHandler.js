/**
 * Central Error Handler Middleware
 * Sanitizes errors to prevent exposing internal database schemas, credentials, or stack traces.
 */
export function errorHandler(err, req, res, _next) {
  // Log internal error safely on the server side without credentials
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  }

  // Handle PostgreSQL Relational Database Errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          error: 'Conflict: A record with this information already exists in the archive.'
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          error: 'Invalid reference: The associated resource or category does not exist.'
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          success: false,
          error: 'Database constraint error: A required field was not provided.'
        });
      case '22P02': // invalid_text_representation
        return res.status(400).json({
          success: false,
          error: 'Invalid data format provided for this query.'
        });
      case '28P01': // invalid_password / auth failure
      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
        return res.status(503).json({
          success: false,
          error: 'Database service is temporarily unreachable. Please try again shortly.'
        });
      default:
        break;
    }
  }

  const statusCode = err.status || err.statusCode || 500;
  // If it's a 500 error in production, use a safe generic message
  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage = (statusCode === 500 && isProduction)
    ? 'An unexpected error occurred. Our engineers have been alerted.'
    : (err.message || 'Internal atelier server error.');

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
    stack: !isProduction && process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
