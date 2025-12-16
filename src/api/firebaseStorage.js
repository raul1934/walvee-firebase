import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path (default: 'uploads')
 * @returns {Promise<{file_url: string}>} - The download URL
 */
export async function uploadFile(file, folder = 'uploads') {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Generate unique filename with timestamp and user ID
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${currentUser.uid}/${timestamp}_${safeFileName}`;

  // Create storage reference
  const storageRef = ref(storage, fileName);

  // Upload file
  const snapshot = await uploadBytes(storageRef, file);

  // Get download URL
  const file_url = await getDownloadURL(snapshot.ref);

  return { file_url };
}

/**
 * Upload an image file with validation
 * @param {File} file - The image file to upload
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @returns {Promise<{file_url: string}>} - The download URL
 */
export async function uploadImage(file, maxSizeMB = 5) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Image size must be less than ${maxSizeMB}MB`);
  }

  return uploadFile(file, 'images');
}

// Legacy API compatibility - matches base44 integrations API
export const Core = {
  UploadFile: async ({ file }) => uploadFile(file),
  UploadImage: async ({ file }) => uploadImage(file)
};
