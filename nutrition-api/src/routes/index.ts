import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as user    from '../controllers/userController';
import * as intake  from '../controllers/intakeController';
import * as workout from '../controllers/workoutController';

const router = Router();
router.use(authMiddleware);

router.get  ('/me',             user.getProfile);
router.patch('/me',             user.updateProfile);
router.get  ('/me/goal',        user.getGoal);
router.post ('/me/goal',        user.setGoal);

router.get  ('/intake',         intake.getIntakeLog);
router.post ('/intake',         intake.addIntakeEntry);
router.post ('/intake/water',   intake.addWater);
router.get  ('/intake/weekly',  intake.getWeeklySummary);

router.get  ('/workout',        workout.getWorkoutLog);
router.post ('/workout',        workout.addWorkoutEntry);
router.get  ('/workout/weekly', workout.getWeeklySummary);
router.get  ('/exercises',      workout.getExercises);

export default router;