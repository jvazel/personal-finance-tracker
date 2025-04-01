import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from './Modal';
import '../styles/goals.css';

const GoalsSavings = () => {
  const [goals, setGoals] = useState([]);
  const [expenseLimits, setExpenseLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [showUpdateProgressForm, setShowUpdateProgressForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'savings',
    category: '',
    targetAmount: '',
    targetDate: '',
  });
  const [progressData, setProgressData] = useState({
    amount: '',
    description: ''
  });
  const [categories, setCategories] = useState([]);

  // Récupérer les objectifs et les catégories au chargement du composant
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const [goalsResponse, categoriesResponse, expenseLimitsResponse] = await Promise.all([
          axios.get('/api/goals'),
          axios.get('/api/transactions/categories'),
          axios.get('/api/goals/expense-limits')
        ]);
        
        setGoals(goalsResponse.data);
        setCategories(categoriesResponse.data);
        setExpenseLimits(expenseLimitsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des objectifs:', err);
        setError('Erreur lors du chargement des objectifs. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  // Filtrer les objectifs par type
  const savingsGoals = goals.filter(goal => goal.type === 'savings');
  const expenseLimitGoals = goals.filter(goal => goal.type === 'expense_limit');

  // Gérer les changements dans le formulaire d'ajout d'objectif
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gérer les changements dans le formulaire de mise à jour de progression
  const handleProgressChange = (e) => {
    const { name, value } = e.target;
    setProgressData(prev => ({ ...prev, [name]: value }));
  };

  // Soumettre le formulaire d'ajout d'objectif
  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/goals', {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount)
      });
      
      setGoals(prev => [response.data, ...prev]);
      setShowAddGoalForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'savings',
        category: '',
        targetAmount: '',
        targetDate: ''
      });
      
      // Rafraîchir les statistiques de limite de dépenses si nécessaire
      if (formData.type === 'expense_limit') {
        const expenseLimitsResponse = await axios.get('/api/goals/expense-limits');
        setExpenseLimits(expenseLimitsResponse.data);
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'objectif:', err);
      alert('Erreur lors de la création de l\'objectif. Veuillez réessayer.');
    }
  };

  // Soumettre le formulaire de mise à jour de progression
  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/goals/${selectedGoal._id}/progress`, {
        amount: parseFloat(progressData.amount),
        description: progressData.description
      });
      
      // Mettre à jour l'objectif dans la liste
      setGoals(prev => prev.map(goal => 
        goal._id === response.data._id ? response.data : goal
      ));
      
      setShowUpdateProgressForm(false);
      setSelectedGoal(null);
      setProgressData({
        amount: '',
        description: ''
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la progression:', err);
      alert('Erreur lors de la mise à jour de la progression. Veuillez réessayer.');
    }
  };

  // Supprimer un objectif
  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      try {
        await axios.delete(`/api/goals/${goalId}`);
        setGoals(prev => prev.filter(goal => goal._id !== goalId));
        
        // Rafraîchir les statistiques de limite de dépenses
        const expenseLimitsResponse = await axios.get('/api/goals/expense-limits');
        setExpenseLimits(expenseLimitsResponse.data);
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'objectif:', err);
        alert('Erreur lors de la suppression de l\'objectif. Veuillez réessayer.');
      }
    }
  };

  // Ouvrir le formulaire de mise à jour de progression
  const openUpdateProgressForm = (goal) => {
    setSelectedGoal(goal);
    setShowUpdateProgressForm(true);
  };

  // Juste après la ligne "if (error) return..."
  if (loading) return <div className="loading-indicator">Chargement des objectifs...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  // Ajoutons un test simple pour le modal
  console.log("État actuel du modal:", showAddGoalForm);
  
  // Ajouter cette fonction avant le return
  const handleAddGoalClick = () => {
    console.log("Fonction handleAddGoalClick appelée");
    setShowAddGoalForm(true);
  };
  
  // Puis dans le JSX
  return (
    <div className="goals-savings-container">
      <h2>Objectifs d'Épargne et Suivi des Progrès</h2>
      
      <div className="goals-actions">
        <button 
          className="btn btn-primary add-goal-btn" 
          onClick={handleAddGoalClick}
        >
          <i className="fas fa-plus-circle"></i> Ajouter un nouvel objectif
        </button>
      </div>
      
      {/* Le reste du code reste inchangé */}
      <div className="goals-section">
        <h3>Objectifs d'Épargne</h3>
        
        {savingsGoals.length === 0 ? (
          <p className="no-goals-message">Aucun objectif d'épargne défini. Créez votre premier objectif !</p>
        ) : (
          <div className="goals-grid">
            {savingsGoals.map(goal => (
              <div key={goal._id} className={`goal-card ${goal.isCompleted ? 'completed' : ''}`}>
                <div className="goal-header">
                  <h4>{goal.title}</h4>
                  <div className="goal-actions">
                    <button 
                      className="btn btn-sm btn-primary goal-action-btn update-btn"
                      onClick={() => openUpdateProgressForm(goal)}
                      disabled={goal.isCompleted}
                    >
                      <i className="fas fa-chart-line"></i> Mettre à jour
                    </button>
                    <button 
                      className="btn btn-sm btn-danger goal-action-btn delete-btn"
                      onClick={() => handleDeleteGoal(goal._id)}
                    >
                      <i className="fas fa-trash-alt"></i> Supprimer
                    </button>
                  </div>
                </div>
                
                <p className="goal-description">{goal.description}</p>
                
                <div className="goal-progress-container">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${goal.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {(goal.progressPercentage || 0).toFixed(1)}%
                  </div>
                </div>
                
                <div className="goal-details">
                  <div className="goal-detail">
                    <span className="detail-label">Objectif:</span>
                    <span className="detail-value">{(goal.targetAmount || 0).toFixed(2)} €</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Actuel:</span>
                    <span className="detail-value">{(goal.currentAmount || 0).toFixed(2)} €</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Restant:</span>
                    <span className="detail-value">{(goal.remainingAmount || 0).toFixed(2)} €</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Date cible:</span>
                    <span className="detail-value">
                      {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Jours restants:</span>
                    <span className="detail-value">
                      {goal.remainingDays > 0 ? goal.remainingDays : 'Dépassé'}
                    </span>
                  </div>
                </div>
                
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="goal-milestones">
                    <h5>Dernières mises à jour</h5>
                    <ul>
                      {goal.milestones.slice(-3).reverse().map((milestone, index) => (
                        <li key={index}>
                          <span className="milestone-amount">
                            +{(milestone.amount || 0).toFixed(2)} €
                          </span>
                          <span className="milestone-date">
                            {formatDistanceToNow(new Date(milestone.date), { addSuffix: true, locale: fr })}
                          </span>
                          {milestone.description && (
                            <span className="milestone-description">
                              {milestone.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Section des limites de dépenses */}
      <div className="goals-section">
        <h3>Limites de Dépenses par Catégorie</h3>
        
        {expenseLimitGoals.length === 0 ? (
          <p className="no-goals-message">Aucune limite de dépense définie. Créez votre première limite !</p>
        ) : (
          <div className="expense-limits-container">
            {expenseLimits.map(limit => (
              <div key={limit.goalId} className={`expense-limit-card ${limit.isExceeded ? 'exceeded' : ''}`}>
                <div className="expense-limit-header">
                  <h4>{limit.title}</h4>
                  <button 
                    className="btn btn-sm btn-danger goal-action-btn delete-btn"
                    onClick={() => handleDeleteGoal(limit.goalId)}
                  >
                    <i className="fas fa-trash-alt"></i> Supprimer
                  </button>
                </div>
                
                <div className="expense-limit-category">
                  Catégorie: {limit.category}
                </div>
                
                <div className="expense-limit-progress-container">
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar ${limit.percentage > 80 ? 'warning' : ''} ${limit.isExceeded ? 'danger' : ''}`}
                      style={{ width: `${limit.percentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {(limit.percentage || 0).toFixed(1)}%
                  </div>
                </div>
                
                <div className="expense-limit-details">
                  <div className="expense-limit-detail">
                    <span className="detail-label">Limite:</span>
                    <span className="detail-value">{(limit.targetAmount || 0).toFixed(2)} €</span>
                  </div>
                  <div className="expense-limit-detail">
                    <span className="detail-label">Dépensé:</span>
                    <span className={`detail-value ${limit.isExceeded ? 'text-danger' : ''}`}>
                      {(limit.currentExpense || 0).toFixed(2)} €
                    </span>
                  </div>
                  <div className="expense-limit-detail">
                    <span className="detail-label">Restant:</span>
                    <span className="detail-value">
                      {limit.isExceeded ? '0.00' : (limit.remainingAmount || 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
                
                {limit.isExceeded && (
                  <div className="expense-limit-alert">
                    <span className="alert-icon">⚠️</span>
                    <span>Limite dépassée de {((limit.currentExpense || 0) - (limit.targetAmount || 0)).toFixed(2)} €</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal pour ajouter un nouvel objectif */}
      <Modal 
        isOpen={showAddGoalForm} 
        onClose={() => setShowAddGoalForm(false)}
        title="Ajouter un nouvel objectif"
      >
        <form onSubmit={handleSubmitGoal} className="goal-form">
          <div className="form-group">
            <label htmlFor="type">Type d'objectif</label>
            <select 
              id="type" 
              name="type" 
              value={formData.type} 
              onChange={handleFormChange}
              required
            >
              <option value="savings">Objectif d'épargne</option>
              <option value="expense_limit">Limite de dépense</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="title">Titre</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              value={formData.title} 
              onChange={handleFormChange}
              placeholder="Ex: Vacances d'été, Achat immobilier..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (optionnelle)</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleFormChange}
              placeholder="Décrivez votre objectif..."
              rows="3"
            />
          </div>
          
          {formData.type === 'expense_limit' && (
            <div className="form-group">
              <label htmlFor="category">Catégorie</label>
              <select 
                id="category" 
                name="category" 
                value={formData.category} 
                onChange={handleFormChange}
                required={formData.type === 'expense_limit'}
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="targetAmount">
              {formData.type === 'savings' ? 'Montant cible' : 'Limite de dépense'}
            </label>
            <input 
              type="number" 
              id="targetAmount" 
              name="targetAmount" 
              value={formData.targetAmount} 
              onChange={handleFormChange}
              placeholder="Montant en euros"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="targetDate">Date cible</label>
            <input 
              type="date" 
              id="targetDate" 
              name="targetDate" 
              value={formData.targetDate} 
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddGoalForm(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal pour mettre à jour la progression */}
      <Modal 
        isOpen={showUpdateProgressForm} 
        onClose={() => {
          setShowUpdateProgressForm(false);
          setSelectedGoal(null);
        }}
        title={selectedGoal ? `Mettre à jour: ${selectedGoal.title}` : 'Mettre à jour la progression'}
      >
        {selectedGoal && (
          <form onSubmit={handleSubmitProgress} className="progress-form">
            <div className="goal-progress-info">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${selectedGoal.progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-details">
                <p>Progression actuelle: {selectedGoal.currentAmount.toFixed(2)} € / {selectedGoal.targetAmount.toFixed(2)} €</p>
                <p>Restant: {selectedGoal.remainingAmount.toFixed(2)} €</p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Montant à ajouter</label>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                value={progressData.amount} 
                onChange={handleProgressChange}
                placeholder="Montant en euros"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="progressDescription">Description (optionnelle)</label>
              <textarea 
                id="progressDescription" 
                name="description" 
                value={progressData.description} 
                onChange={handleProgressChange}
                placeholder="Ex: Économies du mois, Prime reçue..."
                rows="2"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowUpdateProgressForm(false);
                  setSelectedGoal(null);
                }}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Mettre à jour
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default GoalsSavings;