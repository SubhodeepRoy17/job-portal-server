const express = require('express');
const router = express.Router();
const companyProfileController = require('../controllers/companyProfileController');
const fileUploadController = require('../controllers/fileUploadController');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const CompanyProfileDataRules = require('../validators/CompanyProfileDataRules');
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://job-portal-client-ashen.vercel.app',
    'https://job-portal-server-six-eosin.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware to specific routes
router.use(cors(corsOptions));

// File Upload Route (no auth during registration)
router.post('/api/company/upload',
    fileUploadController.getUploadMiddleware(),
    fileUploadController.uploadFile
);

// Registration Route
router.post('/api/company/register',
    CompanyProfileDataRules.registerValidation(),
    companyProfileController.register
);

// Login Route
router.post('/api/company/login',
    CompanyProfileDataRules.loginValidation(),
    companyProfileController.login
);

// Protected Routes (require auth)
router.use(auth);
router.use(roleCheck('company'));

// Profile Routes
router.get('/api/company/profile',
    companyProfileController.getProfile
);

router.put('/api/company/profile',
    CompanyProfileDataRules.updateValidation(),
    companyProfileController.updateProfile
);

module.exports = router;