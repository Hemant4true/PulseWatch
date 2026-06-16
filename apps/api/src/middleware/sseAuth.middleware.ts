import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export const sseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token in query parameters' });
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid user' });
    }
    
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
