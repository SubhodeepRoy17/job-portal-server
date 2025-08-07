const express = require('express');
const router = express.Router();
const companyProfileController = require('../Controller/companyProfileController');
const fileUploadController = require('../Controller/fileUploadController');
const CompanyProfileDataRules = require('../Validation/CompanyProfileDataRules');
const cors = require('cors');

// CORS configuration
const corsOptions = {
    origin: [
        "https://job-portal-client-ashen.vercel.app",
        "https://researchengine.in",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "X-Client-Platform", "Authorization"],
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
  CompanyProfileDataRules.loginValidation(), // Use the new validation
  companyProfileController.login
);

router.get('/profile', companyProfileController.getCompanyProfile);

router.put('/profile',
  CompanyProfileDataRules.updateValidation(),
  companyProfileController.updateProfile
);

module.exports = router;