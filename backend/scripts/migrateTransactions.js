const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
require('dotenv').config();

// Connexion à la base de données
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

async function migrateTransactionCategories() {
  try {
    // Récupérer toutes les transactions
    const transactions = await Transaction.find({});
    console.log(`Trouvé ${transactions.length} transactions à migrer`);
    
    // Récupérer toutes les catégories pour éviter des requêtes multiples
    const allCategories = await Category.find({});
    console.log(`Trouvé ${allCategories.length} catégories disponibles`);
    
    // Créer un map des catégories par nom et par utilisateur pour une recherche plus rapide
    const categoryMap = {};
    allCategories.forEach(category => {
      const userId = category.user ? category.user.toString() : 'nouser';
      if (!categoryMap[userId]) {
        categoryMap[userId] = {};
      }
      // Stocker la catégorie par son nom en minuscules pour une recherche insensible à la casse
      categoryMap[userId][category.name.toLowerCase()] = category;
    });
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Pour chaque transaction
    for (const transaction of transactions) {
      try {
        const userId = transaction.user ? transaction.user.toString() : 'nouser';
        console.log(`Traitement de la transaction ${transaction._id}, utilisateur: ${userId}`);
        
        // Vérifier si la catégorie est déjà un ObjectId valide
        if (mongoose.Types.ObjectId.isValid(transaction.category)) {
          // Vérifier si l'ObjectId correspond à une catégorie existante
          const categoryExists = await Category.findById(transaction.category);
          if (categoryExists) {
            console.log(`Transaction ${transaction._id} a déjà une catégorie valide: ${categoryExists.name}`);
            successCount++;
            continue; // Passer à la transaction suivante
          } else {
            console.log(`Transaction ${transaction._id} a un ID de catégorie invalide: ${transaction.category}`);
          }
        }
        
        // Si la catégorie est une chaîne de caractères ou un ObjectId invalide
        if (typeof transaction.category === 'string' || !mongoose.Types.ObjectId.isValid(transaction.category)) {
          const categoryName = typeof transaction.category === 'string' ? transaction.category.toLowerCase() : '';
          console.log(`Recherche de la catégorie "${categoryName}" pour l'utilisateur ${userId}`);
          
          // Vérifier si l'utilisateur a des catégories
          if (categoryMap[userId]) {
            // Rechercher la catégorie par son nom
            const category = categoryMap[userId][categoryName];
            
            if (category) {
              // Mettre à jour la transaction avec l'ID de la catégorie
              transaction.category = category._id;
              await transaction.save();
              console.log(`Transaction ${transaction._id} mise à jour avec la catégorie ${category.name}`);
              successCount++;
            } else {
              // Si aucune catégorie correspondante n'est trouvée, utiliser une catégorie par défaut
              console.log(`Catégorie "${categoryName}" non trouvée pour la transaction ${transaction._id}`);
              
              // Rechercher une catégorie par défaut (par exemple "Autre" ou "Divers")
              const defaultCategory = categoryMap[userId]['autre'] || categoryMap[userId]['divers'] || 
                                     Object.values(categoryMap[userId])[0]; // Prendre la première catégorie disponible
              
              if (defaultCategory) {
                transaction.category = defaultCategory._id;
                await transaction.save();
                console.log(`Transaction ${transaction._id} mise à jour avec la catégorie par défaut ${defaultCategory.name}`);
                successCount++;
              } else {
                console.log(`Aucune catégorie disponible pour l'utilisateur ${userId}`);
                errorCount++;
              }
            }
          } else {
            console.log(`Aucune catégorie trouvée pour l'utilisateur ${userId}`);
            errorCount++;
          }
        } else {
          console.log(`Transaction ${transaction._id} a une catégorie de type inconnu: ${typeof transaction.category}`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`Erreur lors de la migration de la transaction ${transaction._id}:`, err);
        errorCount++;
      }
    }
    
    console.log('Migration terminée');
    console.log(`Succès: ${successCount}, Erreurs: ${errorCount}, Ignorés: ${skippedCount}`);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  }
}

// Exécuter la migration
migrateTransactionCategories();