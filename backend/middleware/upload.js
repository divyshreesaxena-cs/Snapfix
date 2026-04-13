const multer = require('multer');
const AppError = require('../utils/AppError');

const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new AppError('Only image files are allowed (jpeg, jpg, png, webp)', 400, 'INVALID_FILE_TYPE'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    files: 3,
  },
  fileFilter,
});

module.exports = upload;
