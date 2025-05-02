const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

// Routes pour les objectifs
router.get('/', goalController.getAllGoals);
router.get('/savings-goals', goalController.getSavingsGoals);
router.get('/expense-limits', goalController.getExpenseLimitStats);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/progress', goalController.updateGoalProgress);

module.exports = router;