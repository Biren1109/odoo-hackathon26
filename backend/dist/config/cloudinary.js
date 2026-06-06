"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMulter = void 0;
exports.uploadToCloudinary = uploadToCloudinary;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Memory storage — buffers are uploaded to Cloudinary manually
exports.uploadMulter = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOCX, PNG, JPG allowed.'));
        }
    },
});
// Upload a buffer to Cloudinary and return the secure URL
async function uploadToCloudinary(buffer, folder, originalName) {
    return new Promise((resolve, reject) => {
        const publicId = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
        cloudinary_1.v2.uploader
            .upload_stream({ folder, public_id: publicId, resource_type: 'auto' }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result.secure_url);
        })
            .end(buffer);
    });
}
exports.default = cloudinary_1.v2;
