const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const { startOfMonth, endOfMonth } = require('date-fns');

// Récupérer tous les objectifs
exports.getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    
    // Ajouter des propriétés calculées pour chaque objectif
    const goalsWithProgress = goals.map(goal => {
      const goalObj = goal.toObject();
      goalObj.progressPercentage = goal.getProgressPercentage();
      goalObj.remainingAmount = goal.getRemainingAmount();
      goalObj.remainingDays = goal.getRemainingDays();
      return goalObj;
    });
    
    res.json(goalsWithProgress);
  } catch (err) {
    console.error('Erreur lors de la récupération des objectifs:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs' });
  }
};

// Récupérer un objectif par son ID
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    const goalObj = goal.toObject();
    goalObj.progressPercentage = goal.getProgressPercentage();
    goalObj.remainingAmount = goal.getRemainingAmount();
    goalObj.remainingDays = goal.getRemainingDays();
    
    res.json(goalObj);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'objectif:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'objectif' });
  }
};

// Créer un nouvel objectif
exports.createGoal = async (req, res) => {
  try {
    const newGoal = new Goal(req.body);
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    console.error('Erreur lors de la création de l\'objectif:', err);
    res.status(400).json({ message: 'Erreur lors de la création de l\'objectif', error: err.message });
  }
};

// Mettre à jour un objectif
exports.updateGoal = async (req, res) => {
  try {
    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    const goalObj = updatedGoal.toObject();
    goalObj.progressPercentage = updatedGoal.getProgressPercentage();
    goalObj.remainingAmount = updatedGoal.getRemainingAmount();
    goalObj.remainingDays = updatedGoal.getRemainingDays();
    
    res.json(goalObj);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'objectif:', err);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'objectif', error: err.message });
  }
};

// Supprimer un objectif
exports.deleteGoal = async (req, res) => {
  try {
    const deletedGoal = await Goal.findByIdAndDelete(req.params.id);
    
    if (!deletedGoal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    res.json({ message: 'Objectif supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'objectif:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'objectif' });
  }
};

// Mettre à jour la progression d'un objectif d'épargne
exports.updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    // Ajouter le montant à la progression actuelle
    goal.currentAmount += parseFloat(amount);
    
    // Ajouter un jalon si une description est fournie
    if (description) {
      goal.milestones.push({
        amount: parseFloat(amount),
        date: new Date(),
        description
      });
    }
    
    // Vérifier si l'objectif est atteint
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    
    await goal.save();
    
    const goalObj = goal.toObject();
    goalObj.progressPercentage = goal.getProgressPercentage();
    goalObj.remainingAmount = goal.getRemainingAmount();
    goalObj.remainingDays = goal.getRemainingDays();
    
    res.json(goalObj);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la progression:', err);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la progression', error: err.message });
  }
};

// Obtenir les statistiques pour les objectifs de limite de dépenses
exports.getExpenseLimitStats = async (req, res) => {
  try {
    // Récupérer tous les objectifs de type limite de dépenses
    const expenseLimitGoals = await Goal.find({ 
      type: 'expense_limit',
      isActive: true 
    });
    
    // Obtenir le premier jour du mois en cours
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    
    // Récupérer toutes les transactions de dépenses du mois en cours
    const expenses = await Transaction.find({
      type: 'expense',
      date: { 
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });
    
    // Calculer les dépenses par catégorie
    const expensesByCategory = {};
    expenses.forEach(expense => {
      const category = expense.category;
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += Math.abs(expense.amount);
    });
    
    // Préparer les statistiques pour chaque objectif de limite de dépenses
    const stats = expenseLimitGoals.map(goal => {
      const currentExpense = expensesByCategory[goal.category] || 0;
      const percentage = (currentExpense / goal.targetAmount) * 100;
      const isExceeded = currentExpense > goal.targetAmount;
      
      return {
        goalId: goal._id,
        title: goal.title,
        category: goal.category,
        targetAmount: goal.targetAmount,
        currentExpense,
        percentage: Math.min(100, percentage),
        isExceeded,
        remainingAmount: Math.max(0, goal.targetAmount - currentExpense)
      };
    });
    
    res.json(stats);
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques de limite de dépenses:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};