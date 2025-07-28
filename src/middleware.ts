import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers['authorization-token'] as string;
  const expectedToken = process.env.AUTHORIZATION_TOKEN || 'default-token';

  if (!authToken) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  if (authToken !== expectedToken) {
    return res.status(403).json({ error: 'Invalid authorization token' });
  }

  next();
};
