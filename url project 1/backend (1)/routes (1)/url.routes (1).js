const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const urlController = require('../controllers/url.controller');
const auth = require('../middleware/auth');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (accept CSV only)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'text/csv' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// Routes
router.post('/', auth, urlController.createUrl);
router.get('/', auth, urlController.getUserUrls);
router.put('/:id', auth, urlController.updateUrl);
router.delete('/:id', auth, urlController.deleteUrl);
router.post('/bulk', auth, upload.single('file'), urlController.bulkShorten);
router.patch('/:id/toggle-public', auth, urlController.togglePublicStats);
router.patch('/:id/toggle-active', auth, urlController.toggleActiveStatus);

module.exports = router;
