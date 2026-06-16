import { Request, Response, NextFunction } from 'express';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // @ts-ignore
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden: Requires SUPERADMIN' });
  }

  next();
};
