import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where:   { id: req.user!.id },
    include: { goals: { orderBy: { updatedAt: 'desc' }, take: 1 } },
  });
  res.json(user);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { gender, birthDate, heightCm, weightKg, activityLevel } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data:  { gender, birthDate: birthDate ? new Date(birthDate) : undefined, heightCm, weightKg, activityLevel },
  });
  res.json(user);
}

export async function getGoal(req: AuthRequest, res: Response) {
  const goal = await prisma.userGoal.findFirst({
    where:   { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(goal ?? null);
}

export async function setGoal(req: AuthRequest, res: Response) {
  const { goalType } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user?.weightKg || !user?.activityLevel) {
    return res.status(400).json({ error: '체중과 활동량을 먼저 입력해주세요.' });
  }

  const proteinRatio: Record<string, number> = {
    muscle_gain: 2.0, weight_loss: 1.6, maintenance: 1.2, health: 1.0,
  };
  const waterRatio: Record<string, number> = {
    sedentary: 30, light: 33, moderate: 35, active: 38, very_active: 40,
  };
  const exerciseTarget: Record<string, number> = {
    muscle_gain: 60, weight_loss: 45, maintenance: 30, health: 30,
  };

  const data = {
    userId:                 user.id,
    goalType,
    dailyProteinTargetG:    Math.round(user.weightKg * (proteinRatio[goalType] ?? 1.2)),
    dailyWaterTargetMl:     Math.round(user.weightKg * (waterRatio[user.activityLevel] ?? 33)),
    dailyExerciseMinTarget: exerciseTarget[goalType] ?? 30,
  };

  const existing = await prisma.userGoal.findFirst({ where: { userId: user.id } });
  const goal = existing
    ? await prisma.userGoal.update({ where: { id: existing.id }, data })
    : await prisma.userGoal.create({ data });

  res.json(goal);
}