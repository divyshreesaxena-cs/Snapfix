const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { configureCloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const logger = require('../utils/logger');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitizeExt = (originalName = '', mime = '') => {
  const ext = path.extname(originalName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext;
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
};

const uploadBufferToLocal = async (file) => {
  const ext = sanitizeExt(file.originalname, file.mimetype);
  const filename = `img-${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);
  return { url: `/uploads/${filename}`, provider: 'local', filename };
};

const uploadBufferToCloudinary = async (file, folder = 'snapfix/bookings') => {
  const cloudinary = configureCloudinary();
  if (!cloudinary) throw new Error('Cloudinary is not configured');

  const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
    folder,
    resource_type: 'image',
  });

  return {
    url: result.secure_url,
    provider: 'cloudinary',
    publicId: result.public_id,
  };
};

const uploadImages = async (files = [], options = {}) => {
  if (!Array.isArray(files) || files.length === 0) return [];
  const folder = options.folder || 'snapfix/bookings';

  const results = [];
  for (const file of files) {
    if (isCloudinaryConfigured()) {
      try {
        results.push(await uploadBufferToCloudinary(file, folder));
        continue;
      } catch (error) {
        logger.warn('Cloud upload failed, falling back to local storage', { error });
      }
    }
    results.push(await uploadBufferToLocal(file));
  }

  return results;
};

module.exports = { uploadImages };
