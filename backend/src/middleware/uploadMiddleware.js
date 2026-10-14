const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only JPG, PNG, and WebP images are allowed.'), false);
  }
};

const parseImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
}).single('image');

const detectImage = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: '.jpg', mimeType: 'image/jpeg' };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: '.png', mimeType: 'image/png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { extension: '.webp', mimeType: 'image/webp' };
  }
  return null;
};

const upload = (req, res, next) => {
  parseImage(req, res, async (error) => {
    if (error) return next(error);
    if (!req.file) return next();

    const detected = detectImage(req.file.buffer);
    const mimeMatches = detected && (
      detected.mimeType === req.file.mimetype ||
      (detected.mimeType === 'image/jpeg' && req.file.mimetype === 'image/jpg')
    );
    if (!mimeMatches) {
      return next(new Error('Invalid file type! Only JPG, PNG, and WebP images are allowed.'));
    }

    const filename = `device-${crypto.randomUUID()}${detected.extension}`;
    try {
      await fs.promises.writeFile(path.join(uploadDir, filename), req.file.buffer, { flag: 'wx' });
      req.file.filename = filename;
      next();
    } catch (writeError) {
      next(writeError);
    }
  });
};

module.exports = upload;
