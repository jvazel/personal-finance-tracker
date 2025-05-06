import api from './api';

// Fonctions pour appeler les API du simulateur
export const calculateLoan = async (loanData) => {
  try {
    const response = await api.post('/simulator/loan', loanData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du calcul du prêt:', error);
    throw error;
  }
};

export const calculateInvestment = async (investmentData) => {
  try {
    const response = await api.post('/simulator/investment', investmentData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du calcul de l\'investissement:', error);
    throw error;
  }
};

export const calculateRetirement = async (retirementData) => {
  try {
    const response = await api.post('/simulator/retirement', retirementData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du calcul de la retraite:', error);
    throw error;
  }
};