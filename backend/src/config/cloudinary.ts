import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Memory storage — buffers are uploaded to Cloudinary manually
export const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, PNG, JPG allowed.'));
    }
  },
});

// Upload a buffer to Cloudinary and return the secure URL
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  originalName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
    cloudinary.uploader
      .upload_stream(
        { folder, public_id: publicId, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        }
      )
      .end(buffer);
  });
}

export default cloudinary;