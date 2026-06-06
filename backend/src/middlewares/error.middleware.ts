import { Request, Response, NextFunction } from 'express';

<<<<<<< HEAD
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
=======
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8
}
