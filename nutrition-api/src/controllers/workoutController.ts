import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

const toDate = (d?: string) => {
  const date = d ? new Date(d) : new Date();
  return new Date(date.toISOString().split('T')[0]);
};

export async function getWorkoutLog(req: AuthRequest, res: Response) {
  const logDate = toDate(req.query.date as string);
  const log = await prisma.workoutLog.findUnique({
    where:   { userId_logDate: { userId: req.user!.id, logDate } },
    include: { entries: { include: { exercise: true }, orderBy: { loggedAt: 'desc' } } },
  });
  res.json(log ?? { totalCaloriesBurned: 0, totalDurationMin: 0, entries: [] });
}

export async function addWorkoutEntry(req: AuthRequest, res: Response) {
  const { exerciseId, sets, reps, durationMin, weightKg } = req.body;
  const uid = req.user!.id;

  const [user, exercise] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid }, select: { weightKg: true } }),
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
  ]);
  if (!exercise) return res.status(404).json({ error: '운동 종목을 찾을 수 없습니다.' });

  const caloriesBurned = exercise.metValue * (user?.weightKg ?? 70) * ((durationMin ?? 0) / 60);
  const logDate = toDate();

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.workoutLog.upsert({
      where:  { userId_logDate: { userId: uid, logDate } },
      update: {
        totalCaloriesBurned: { increment: caloriesBurned },
        totalDurationMin:    { increment: durationMin ?? 0 },
      },
      create: {
        userId: uid, logDate,
        totalCaloriesBurned: caloriesBurned,
        totalDurationMin:    durationMin ?? 0,
      },
    });
    const entry = await tx.workoutEntry.create({
      data: { workoutLogId: log.id, exerciseId, sets, reps, durationMin, weightKg, caloriesBurned },
    });
    return { log, entry };
  });

  res.status(201).json(result);
}

export async function getExercises(req: AuthRequest, res: Response) {
  const exercises = await prisma.exercise.findMany({
    where:   req.query.category ? { category: req.query.category as any } : undefined,
    orderBy: { name: 'asc' },
  });
  res.json(exercises);
}

export async function getWeeklySummary(req: AuthRequest, res: Response) {
  const uid     = req.user!.id;
  const today   = toDate();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const logs = await prisma.workoutLog.findMany({
    where:   { userId: uid, logDate: { gte: weekAgo, lte: today } },
    orderBy: { logDate: 'asc' },
    select:  { logDate: true, totalCaloriesBurned: true, totalDurationMin: true },
  });

  const result = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const row = logs.find(l => l.logDate.toISOString().split('T')[0] === key);
    return { date: key, totalCaloriesBurned: row?.totalCaloriesBurned ?? 0, totalDurationMin: row?.totalDurationMin ?? 0 };
  });

  res.json(result);
}