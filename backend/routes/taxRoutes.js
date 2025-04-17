const express = require('express');
const taxController = require('../controllers/taxController');
const router = express.Router();

// Récupérer les données fiscales pour une année spécifique
router.get('/data/:year', taxController.getTaxData);

// Générer un rapport fiscal pour une année spécifique
router.post('/report/:year', taxController.generateTaxReport);

// Exporter les données fiscales au format CSV
router.get('/export/:year/:format', taxController.exportTaxData);

// Récupérer tous les rapports fiscaux d'un utilisateur
router.get('/reports', taxController.getTaxReports);

// Supprimer un rapport fiscal
router.delete('/reports/:id', taxController.deleteTaxReport);

// Ajouter cette route
router.get('/reports/:id', taxController.getTaxReportById);

module.exports = router;