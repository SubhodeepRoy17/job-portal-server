const express = require('express');
const router = express.Router();
const companyProfileController = require('../Controller/companyProfileController');
const fileUploadController = require('../Controller/fileUploadController');
const CompanyProfileDataRules = require('../Validation/CompanyProfileDataRules');
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

// Profile Routes
router.get('/api/company/profile',
    companyProfileController.getProfile
);

router.put('/api/company/profile',
    CompanyProfileDataRules.updateValidation(),
    companyProfileController.updateProfile
);

module.exports = router;