const express = require('express');
const router = express.Router();
const importExportController = require('../controllers/importExportController');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accepter uniquement les fichiers CSV
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Seuls les fichiers CSV sont acceptés'), false);
    }
    cb(null, true);
  }
});

// Route pour exporter les transactions
router.get('/export', importExportController.exportTransactions);

// Route pour importer les transactions
router.post('/import', upload.single('file'), importExportController.importTransactions);

module.exports = router;