const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/db4x6r4zm/image/upload';
const CLOUDINARY_PRESET = 'finesse';

/**
 * Upload a file directly to Cloudinary from the browser.
 * Returns the secure URL string on success, throws on failure.
 */
export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error('No file selected');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('cloud_name', 'db4x6r4zm');

  const res  = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
  const data = await res.json();

  if (data.secure_url || data.url) {
    return data.secure_url || data.url;
  }
  throw new Error(data.error?.message || 'Upload failed');
};
