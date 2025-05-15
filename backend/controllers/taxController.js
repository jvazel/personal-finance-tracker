const Transaction = require('../models/Transaction');
const User = require('../models/User');
const TaxReport = require('../models/TaxReport');
const logger = require('../utils/logger');

// Récupérer les données fiscales pour une année spécifique
exports.getTaxData = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    // Définir les dates de début et de fin pour l'année fiscale
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Récupérer toutes les transactions de l'année
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    // Calculer les revenus imposables
    const taxableIncome = transactions
      .filter(t => t.type === 'income' && t.category && t.category.taxable)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculer les déductions fiscales
    const taxDeductions = transactions
      .filter(t => t.type === 'expense' && t.category && t.category.taxDeductible)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculer les dons déductibles
    const charitableDonations = transactions
      .filter(t => t.type === 'expense' && t.category && t.category.name === 'Dons')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(userId);

    // Préparer les données fiscales
    const taxData = {
      year: parseInt(year),
      taxableIncome,
      taxDeductions,
      charitableDonations,
      netTaxableIncome: taxableIncome - taxDeductions,
      userInfo: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      },
      transactions: transactions.map(t => ({
        id: t._id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category ? t.category.name : 'Non catégorisé',
        isTaxable: t.category ? t.category.taxable : false,
        isTaxDeductible: t.category ? t.category.taxDeductible : false
      }))
    };

    res.json(taxData);
  } catch (error) {
    logger.error('Erreur lors de la récupération des données fiscales:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      year: req.params.year
    });
    res.status(500).json({ message: 'Erreur lors de la récupération des données fiscales', error: error.message });
  }
};

// Générer un rapport fiscal
exports.generateTaxReport = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user.id;

    // Vérifier si un rapport existe déjà
    let taxReport = await TaxReport.findOne({ user: userId, year: parseInt(year) });

    if (!taxReport) {
      // Définir les dates de début et de fin pour l'année fiscale
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

      // Récupérer toutes les transactions de l'année
      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('category');

      // Calculer les revenus imposables
      const taxableIncome = transactions
        .filter(t => t.type === 'income' && t.category && t.category.taxable)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculer les déductions fiscales
      const taxDeductions = transactions
        .filter(t => t.type === 'expense' && t.category && t.category.taxDeductible)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Créer un nouveau rapport fiscal
      taxReport = new TaxReport({
        user: userId,
        year: parseInt(year),
        taxableIncome,
        taxDeductions,
        netTaxableIncome: taxableIncome - taxDeductions,
        status: 'generated',
        generatedAt: new Date()
      });

      await taxReport.save();
    }

    res.json(taxReport);
  } catch (error) {
    logger.error('Erreur lors de la génération du rapport fiscal:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      year: req.params.year
    });
    res.status(500).json({ message: 'Erreur lors de la génération du rapport fiscal', error: error.message });
  }
};

// Exporter les données fiscales au format CSV
exports.exportTaxData = async (req, res) => {
  try {
    const { year, format } = req.params;
    const userId = req.user.id;

    // Définir les dates de début et de fin pour l'année fiscale
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Récupérer toutes les transactions de l'année
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    if (format === 'csv') {
      // Préparer les données CSV
      let csvContent = 'Date,Description,Montant,Type,Catégorie,Imposable,Déductible\n';
      
      transactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString('fr-FR');
        const description = t.description.replace(/,/g, ' ');
        const amount = t.amount.toFixed(2);
        const type = t.type === 'income' ? 'Revenu' : 'Dépense';
        const category = t.category ? t.category.name.replace(/,/g, ' ') : 'Non catégorisé';
        const taxable = t.category && t.category.taxable ? 'Oui' : 'Non';
        const deductible = t.category && t.category.taxDeductible ? 'Oui' : 'Non';
        
        csvContent += `${date},"${description}",${amount},${type},${category},${taxable},${deductible}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=donnees_fiscales_${year}.csv`);
      res.send(csvContent);
    } else {
      res.status(400).json({ message: 'Format non supporté' });
    }
  } catch (error) {
    logger.error('Erreur lors de l\'exportation des données fiscales:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      year: req.params.year,
      format: req.params.format
    });
    res.status(500).json({ message: 'Erreur lors de l\'exportation des données fiscales', error: error.message });
  }
};

// Récupérer tous les rapports fiscaux d'un utilisateur
exports.getTaxReports = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const taxReports = await TaxReport.find({ user: userId }).sort({ year: -1 });
    
    res.json(taxReports);
  } catch (error) {
    logger.error('Erreur lors de la récupération des rapports fiscaux:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id
    });
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports fiscaux', error: error.message });
  }
};

exports.deleteTaxReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;

    // Vérifier si le rapport existe et appartient à l'utilisateur
    const report = await TaxReport.findOne({ _id: reportId, user: userId });
    
    if (!report) {
      return res.status(404).json({ message: 'Rapport fiscal non trouvé' });
    }

    // Supprimer le rapport
    await TaxReport.findByIdAndDelete(reportId);
    
    res.status(200).json({ message: 'Rapport fiscal supprimé avec succès' });
  } catch (err) {
    logger.error('Erreur lors de la suppression du rapport fiscal:', { 
      error: err.message, 
      stack: err.stack,
      userId: req.user.id,
      reportId: req.params.id
    });
    res.status(500).json({ message: 'Erreur lors de la suppression du rapport fiscal' });
  }
};

// Ajouter cette fonction au contrôleur
exports.getTaxReportById = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;

    const report = await TaxReport.findOne({
      _id: reportId,
      user: userId
    });

    if (!report) {
      return res.status(404).json({ message: 'Rapport fiscal non trouvé' });
    }

    res.json(report);
  } catch (error) {
    logger.error('Erreur lors de la récupération du rapport fiscal:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user.id,
      reportId: req.params.id
    });
    res.status(500).json({ message: 'Erreur lors de la récupération du rapport fiscal' });
  }
};