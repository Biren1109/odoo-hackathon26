import jwt from 'jsonwebtoken';

export function signAccessToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
}