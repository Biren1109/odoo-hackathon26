import { Router } from 'express';
import multer from 'multer';
import { register, login, forgotPassword, resetPassword, refreshToken, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Cloudinary integration via P2/P3 can replace later

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);

export default router;