import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 없습니다.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error('Invalid payload');

    const user = await prisma.user.upsert({
      where:  { googleId: payload.sub },
      update: { name: payload.name ?? '사용자', photoUrl: payload.picture },
      create: {
        googleId: payload.sub,
        email:    payload.email ?? '',
        name:     payload.name  ?? '사용자',
        photoUrl: payload.picture,
      },
      select: { id: true, email: true },
    });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}