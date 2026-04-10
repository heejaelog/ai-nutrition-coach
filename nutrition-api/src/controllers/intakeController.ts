import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

const toDate = (d?: string) => {
  const date = d ? new Date(d) : new Date();
  return new Date(date.toISOString().split('T')[0]);
};

export async function getIntakeLog(req: AuthRequest, res: Response) {
  const logDate = toDate(req.query.date as string);
  const log = await prisma.intakeLog.findUnique({
    where:   { userId_logDate: { userId: req.user!.id, logDate } },
    include: { entries: { orderBy: { loggedAt: 'desc' } } },
  });
  res.json(log ?? { totalProteinG: 0, totalWaterMl: 0, entries: [] });
}

export async function addIntakeEntry(req: AuthRequest, res: Response) {
  const { entryType, customFoodName, proteinG, waterMl, quantity = 1 } = req.body;
  const uid     = req.user!.id;
  const logDate = toDate();

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.intakeLog.upsert({
      where:  { userId_logDate: { userId: uid, logDate } },
      update: {
        totalProteinG: { increment: proteinG * quantity },
        totalWaterMl:  { increment: waterMl  * quantity },
      },
      create: {
        userId: uid, logDate,
        totalProteinG: proteinG * quantity,
        totalWaterMl:  waterMl  * quantity,
      },
    });
    const entry = await tx.intakeEntry.create({
      data: { intakeLogId: log.id, entryType, customFoodName, proteinG: proteinG * quantity, waterMl: waterMl * quantity, quantity },
    });
    return { log, entry };
  });

  res.status(201).json(result);
}

export async function addWater(req: AuthRequest, res: Response) {
  req.body = { entryType: 'custom', customFoodName: '물', proteinG: 0, waterMl: req.body.waterMl ?? 200, quantity: 1 };
  return addIntakeEntry(req, res);
}

export async function getWeeklySummary(req: AuthRequest, res: Response) {
  const uid     = req.user!.id;
  const today   = toDate();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const logs = await prisma.intakeLog.findMany({
    where:   { userId: uid, logDate: { gte: weekAgo, lte: today } },
    orderBy: { logDate: 'asc' },
    select:  { logDate: true, totalProteinG: true, totalWaterMl: true },
  });

  const result = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const row = logs.find(l => l.logDate.toISOString().split('T')[0] === key);
    return { date: key, totalProteinG: row?.totalProteinG ?? 0, totalWaterMl: row?.totalWaterMl ?? 0 };
  });

  res.json(result);
}