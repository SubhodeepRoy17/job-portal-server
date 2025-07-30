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
    'http://localhost:5173', // Add local dev port
    'https://job-portal-client-ashen.vercel.app',
    'https://job-portal-server-six-eosin.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Apply CORS middleware with options
router.use(cors(corsOptions));
router.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Public Routes (no authentication required)
router.post('/upload',
  fileUploadController.getUploadMiddleware(),
  fileUploadController.uploadFile
);

router.post('/register',
  CompanyProfileDataRules.registerValidation(),
  companyProfileController.register
);

router.post('/login',
  CompanyProfileDataRules.loginValidation(),
  companyProfileController.login
);

router.get('/profile',
  companyProfileController.getProfile
);

router.put('/profile',
  CompanyProfileDataRules.updateValidation(),
  companyProfileController.updateProfile
);

module.exports = router;