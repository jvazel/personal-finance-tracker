import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from './Modal';
import '../styles/goals.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import api from '../services/api';

const GoalsSavings = () => {
  // Ajoutez cet état pour déclencher le rafraîchissement
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { currentUser } = useContext(AuthContext);
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
    targetDate: new Date(), // Initialiser avec la date actuelle
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
        
        if (!currentUser) {
          setError('Vous devez être connecté pour voir vos objectifs.');
          setLoading(false);
          return;
        }
        
        const userId = currentUser._id || currentUser.id || currentUser.uid;
        
        if (!userId) {
          setError('Impossible de déterminer votre identifiant utilisateur.');
          setLoading(false);
          return;
        }
        
        const [goalsResponse, categoriesResponse, expenseLimitsResponse] = await Promise.all([
          api.get('/api/goals'),
          api.get('/api/transactions/categories'),
          api.get('/api/goals/expense-limits')
        ]);
        
        const userGoals = Array.isArray(goalsResponse.data) 
          ? goalsResponse.data.filter(goal => {
              if (!goal.user) {
                return false;
              }
              
              let goalUserId = null;

              if (typeof goal.user === 'string') {
                goalUserId = goal.user;
              }
              
              const goalUserIdStr = String(goalUserId);
              const userIdStr = String(userId);
              
              return goalUserIdStr === userIdStr;
            })
          : [];
          
        setGoals(userGoals);
        setCategories(categoriesResponse.data);
        setExpenseLimits(expenseLimitsResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des objectifs:', err);
        setError('Erreur lors du chargement des objectifs. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchGoals();
  }, [refreshTrigger, currentUser]); // Ajout de currentUser comme dépendance
  
  // Filtrer les objectifs par type
  const savingsGoals = goals.filter(goal => goal.type === 'savings');
  const expenseLimitGoals = goals.filter(goal => goal.type === 'expense_limit');

  // Gérer les changements dans le formulaire d'ajout d'objectif
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ajouter cette fonction pour gérer le changement de date
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, targetDate: date }));
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
      let response;
      
      // Déterminer l'ID de l'utilisateur
      const userId = currentUser._id || currentUser.id || currentUser.uid;
      
      if (!userId) {
        console.error('ID utilisateur manquant lors de la création de l\'objectif');
        alert('Erreur: Impossible de déterminer votre identifiant utilisateur.');
        return;
      }
      
      if (selectedGoal) {
        // Mode édition
        response = await api.put(`/api/goals/${selectedGoal._id}`, {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          user: userId // Utiliser 'user' au lieu de 'userId'
        });
        
        // Mettre à jour l'objectif dans la liste
        setGoals(prev => prev.map(goal => 
          goal._id === response.data._id ? response.data : goal
        ));
      } else {
        // Mode ajout
        response = await api.post('/api/goals', {
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: 0, // Assurez-vous que currentAmount est initialisé
          user: userId // Utiliser 'user' au lieu de 'userId'
        });
        
        setGoals(prev => [response.data, ...prev]);
      }
      
      // Déclencher un rafraîchissement des données
      setRefreshTrigger(prev => prev + 1);
      
      setShowAddGoalForm(false);
      setSelectedGoal(null);
      setFormData({
        title: '',
        description: '',
        type: 'savings',
        category: '',
        targetAmount: '',
        targetDate: new Date()
      });
      
      // Rafraîchir les statistiques de limite de dépenses si nécessaire
      if (formData.type === 'expense_limit') {
        const expenseLimitsResponse = await api.get('/api/goals/expense-limits');
        setExpenseLimits(expenseLimitsResponse.data);
      }
    } catch (err) {
      console.error('Erreur lors de la création/modification de l\'objectif:', err);
      alert('Erreur lors de la création/modification de l\'objectif. Veuillez réessayer.');
    }
  };

  // Soumettre le formulaire de mise à jour de progression
  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/goals/${selectedGoal._id}/progress`, {
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
        await api.delete(`/api/goals/${goalId}`);
        setGoals(prev => prev.filter(goal => goal._id !== goalId));
        
        // Rafraîchir les statistiques de limite de dépenses
        const expenseLimitsResponse = await api.get('/api/goals/expense-limits');
        setExpenseLimits(expenseLimitsResponse.data);
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'objectif:', err);
        alert('Erreur lors de la suppression de l\'objectif. Veuillez réessayer.');
      }
    }
  };

  // Ajouter cette fonction pour gérer l'édition d'un objectif
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      category: goal.category || '',
      targetAmount: goal.targetAmount,
      targetDate: new Date(goal.targetDate)
    });
    setShowAddGoalForm(true);
  };

  // Ouvrir le formulaire de mise à jour de progression
  const openUpdateProgressForm = (goal) => {
    setSelectedGoal(goal);
    setShowUpdateProgressForm(true);
  };

  // Juste après la ligne "if (error) return..."
  if (loading) return <div className="loading-indicator">Chargement des objectifs...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  // Ajouter cette fonction avant le return
  const handleAddGoalClick = () => {
    setShowAddGoalForm(true);
  };
  
  // Fonction de débogage pour afficher tous les objectifs sans filtrage
  const renderDebugSection = () => {
    return (
      <div className="goals-section" style={{border: '2px solid red', marginTop: '20px'}}>
        <h3>Débogage - Tous les objectifs (non filtrés)</h3>
        <p>Nombre total d'objectifs: {goals.length}</p>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', color: 'white', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{border: '1px solid #444', padding: '8px'}}>ID</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Titre</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Type</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Catégorie</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Montant cible</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Montant actuel</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Date cible</th>
                <th style={{border: '1px solid #444', padding: '8px'}}>Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(goal => (
                <tr key={goal._id}>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal._id}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.title}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.type}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.category || 'N/A'}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.targetAmount}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.currentAmount}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'N/A'}</td>
                  <td style={{border: '1px solid #444', padding: '8px'}}>
                    {typeof goal.user === 'object' 
                      ? JSON.stringify(goal.user) 
                      : goal.user || 'Non spécifié'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Puis dans le JSX
  return (
    <div className="goals-savings-container">
      <h2>Objectifs d'Épargne et Suivi des Progrès</h2>
      
      <div className="goals-actions">
        <div 
          className="add-transaction-button" 
          onClick={handleAddGoalClick}
          title="Ajouter un nouvel objectif"
        >
          <i className="fas fa-plus"></i>
        </div>
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
                  <div className="transaction-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditGoal(goal)}
                      disabled={goal.isCompleted}
                      title="Modifier l'objectif"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteGoal(goal._id)}
                      title="Supprimer l'objectif"
                    >
                      <FaTrash />
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
            {expenseLimitGoals.map(limit => {
              // Calculate values needed for display
              const currentAmount = limit.currentAmount || 0;
              const targetAmount = limit.targetAmount || 0;
              const percentage = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
              const isExceeded = currentAmount > targetAmount;
              const remainingAmount = Math.max(0, targetAmount - currentAmount);
              
              return (
                <div key={limit._id} className={`expense-limit-card ${isExceeded ? 'exceeded' : ''}`}>
                  <div className="expense-limit-header">
                    <h4>{limit.title}</h4>
                    <div className="transaction-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditGoal(limit)}
                        title="Modifier la limite"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteGoal(limit._id)}
                        title="Supprimer la limite"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className="expense-limit-category">
                    Catégorie: {limit.category}
                  </div>
                  
                  <div className="expense-limit-progress-container">
                    <div className="progress-bar-container">
                      <div 
                        className={`progress-bar ${percentage > 80 ? 'warning' : ''} ${isExceeded ? 'danger' : ''}`}
                        style={{ width: `${percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {(percentage || 0).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="expense-limit-details">
                    <div className="expense-limit-detail">
                      <span className="detail-label">Limite:</span>
                      <span className="detail-value">{(targetAmount || 0).toFixed(2)} €</span>
                    </div>
                    <div className="expense-limit-detail">
                      <span className="detail-label">Dépensé:</span>
                      <span className={`detail-value ${isExceeded ? 'text-danger' : ''}`}>
                        {(currentAmount || 0).toFixed(2)} €
                      </span>
                    </div>
                    <div className="expense-limit-detail">
                      <span className="detail-label">Restant:</span>
                      <span className="detail-value">
                        {isExceeded ? '0.00' : (remainingAmount || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  
                  {isExceeded && (
                    <div className="expense-limit-alert">
                      <span className="alert-icon">⚠️</span>
                      <span>Limite dépassée de {((currentAmount || 0) - (targetAmount || 0)).toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal pour ajouter un nouvel objectif */}
      <Modal 
        isOpen={showAddGoalForm} 
        onClose={() => {
          setShowAddGoalForm(false);
          setSelectedGoal(null);
          // Réinitialiser les champs du formulaire à vide
          setFormData({
            title: '',
            description: '',
            type: 'savings',
            category: '',
            targetAmount: '',
            targetDate: new Date()
          });
        }}
        title={selectedGoal ? "Modifier l'objectif" : "Ajouter un nouvel objectif"}
      >
        <form onSubmit={handleSubmitGoal} className="goal-form">
          {/* Le reste du formulaire reste inchangé */}
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
              maxLength="50"
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
              maxLength="200"
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
              max="1000000"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="targetDate">Date cible</label>
            <DatePicker
              id="targetDate"
              selected={formData.targetDate}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              minDate={new Date()}
              maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 10))}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => {
              setShowAddGoalForm(false);
              setSelectedGoal(null);
              // Réinitialiser les champs du formulaire à vide
              setFormData({
                title: '',
                description: '',
                type: 'savings',
                category: '',
                targetAmount: '',
                targetDate: new Date()
              });
            }}>
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
