let cloudinaryPackage = null;

const getCloudinary = () => {
  if (cloudinaryPackage) return cloudinaryPackage;
  try {
    // Lazy require so local installs without the package still work with fallback storage.
    // eslint-disable-next-line global-require
    cloudinaryPackage = require('cloudinary').v2;
    return cloudinaryPackage;
  } catch (error) {
    return null;
  }
};

const isCloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const configureCloudinary = () => {
  const cloudinary = getCloudinary();
  if (!cloudinary || !isCloudinaryConfigured()) return null;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
};

module.exports = { getCloudinary, configureCloudinary, isCloudinaryConfigured };
