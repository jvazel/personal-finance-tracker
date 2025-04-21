const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Exporter les transactions au format CSV
exports.exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Validation des dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Les dates de début et de fin sont requises' });
    }

    // Construire la requête
    const query = {
      user: userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Récupérer les transactions
    const transactions = await Transaction.find(query)
      .populate('category', 'name color icon type')
      .sort({ date: 1 });

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Aucune transaction trouvée pour cette période' });
    }

    // Formater les transactions pour l'export
    const formattedTransactions = transactions.map(transaction => {
      const transObj = transaction.toObject();
      return {
        date: transaction.date.toISOString().split('T')[0], // Format YYYY-MM-DD
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transObj.category ? transObj.category.name : '',
        notes: transaction.notes || ''
      };
    });

    // Définir les champs pour le CSV
    const fields = ['date', 'description', 'amount', 'type', 'category', 'notes'];
    const opts = { fields };

    // Convertir en CSV
    const parser = new Parser(opts);
    const csv = parser.parse(formattedTransactions);

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${startDate}-to-${endDate}.csv`);

    // Envoyer le CSV
    res.status(200).send(csv);
  } catch (error) {
    console.error('Erreur lors de l\'export des transactions:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export des transactions', error: error.message });
  }
};

// Importer des transactions depuis un fichier CSV
exports.importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    const userId = req.user.id;
    const filePath = req.file.path;
    const results = [];
    const errors = [];
    
    // Récupérer toutes les catégories de l'utilisateur
    const categories = await Category.find({ user: userId });
    const categoryMap = {};
    
    categories.forEach(category => {
      categoryMap[category.name.toLowerCase()] = category._id;
    });

    // Créer un stream de lecture du fichier CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        // Supprimer le fichier temporaire
        fs.unlinkSync(filePath);
        
        // Traiter chaque ligne du CSV
        const transactions = [];
        
        for (const row of results) {
          try {
            // Valider les données
            if (!row.date || !row.amount || !row.type) {
              errors.push(`Ligne ignorée - données manquantes: ${JSON.stringify(row)}`);
              continue;
            }
            
            // Trouver la catégorie
            let categoryId = null;
            if (row.category) {
              categoryId = categoryMap[row.category.toLowerCase()];
              
              // Si la catégorie n'existe pas, créer une nouvelle catégorie
              if (!categoryId) {
                const newCategory = new Category({
                  name: row.category,
                  type: row.type === 'income' ? 'income' : 'expense',
                  color: '#' + Math.floor(Math.random()*16777215).toString(16), // Couleur aléatoire
                  user: userId
                });
                
                const savedCategory = await newCategory.save();
                categoryId = savedCategory._id;
                categoryMap[row.category.toLowerCase()] = categoryId;
              }
            }
            
            // Créer la transaction
            const transaction = new Transaction({
              date: new Date(row.date),
              description: row.description || 'Transaction importée',
              amount: parseFloat(row.amount),
              type: row.type.toLowerCase() === 'income' ? 'income' : 'expense',
              category: categoryId,
              notes: row.notes || '',
              user: userId
            });
            
            transactions.push(transaction);
          } catch (err) {
            errors.push(`Erreur lors du traitement de la ligne: ${JSON.stringify(row)} - ${err.message}`);
          }
        }
        
        // Sauvegarder les transactions en base de données
        if (transactions.length > 0) {
          await Transaction.insertMany(transactions);
          
          res.status(201).json({
            message: `${transactions.length} transactions importées avec succès`,
            errors: errors.length > 0 ? errors : null
          });
        } else {
          res.status(400).json({
            message: 'Aucune transaction valide n\'a été trouvée dans le fichier',
            errors
          });
        }
      });
  } catch (error) {
    console.error('Erreur lors de l\'import des transactions:', error);
    
    // Supprimer le fichier temporaire en cas d'erreur
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Erreur lors de l\'import des transactions', error: error.message });
  }
};