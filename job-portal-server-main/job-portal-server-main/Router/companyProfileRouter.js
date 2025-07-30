const express = require('express');
const router = express.Router();
const companyProfileController = require('../controllers/companyProfileController');
const fileUploadController = require('../controllers/fileUploadController');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const CompanyProfileDataRules = require('../validators/CompanyProfileDataRules');

// File Upload Route
router.post('/upload',
    auth,
    roleCheck('company'),
    fileUploadController.getUploadMiddleware(),
    fileUploadController.uploadFile
);

// Registration Route
router.post('/register',
    CompanyProfileDataRules.registerValidation(),
    companyProfileController.register
);

// Login Route
router.post('/login',
    CompanyProfileDataRules.loginValidation(),
    companyProfileController.login
);

// Profile Routes
router.get('/profile',
    auth,
    roleCheck('company'),
    companyProfileController.getProfile
);

router.put('/profile',
    auth,
    roleCheck('company'),
    CompanyProfileDataRules.updateValidation(),
    companyProfileController.updateProfile
);

module.exports = router;