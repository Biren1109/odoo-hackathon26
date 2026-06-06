import jwt, { type SignOptions } from 'jsonwebtoken';

export function signAccessToken(userId: string, role: string) {
<<<<<<< HEAD
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
=======
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'] };
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, options);
}

export function signRefreshToken(userId: string) {
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, options);
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
}