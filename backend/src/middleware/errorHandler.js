const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    name: err.name,
    code: err.code,
    path: req.path,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(404).json({ success: false, message: 'Resource not found.' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message });
  }

  // Multer upload error
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum allowed size is 5MB.',
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: 'Invalid file upload.' });
  }

  if (err.message === 'Invalid file type! Only JPG, PNG, and WebP images are allowed.') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Server error. Please try again later.',
  });
};

module.exports = errorHandler;
