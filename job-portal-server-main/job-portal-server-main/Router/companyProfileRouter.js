const express = require('express');
const router = express.Router();
const companyProfileController = require('../controllers/companyProfileController');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const CompanyProfileDataRules = require('../validators/CompanyProfileDataRules');

// Custom validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   POST /api/company/register
// @desc    Register a new company (with strict email validation)
// @access  Public
router.post('/register', 
  CompanyProfileDataRules.registerValidation(),
  validate,
  companyProfileController.register
);

// @route   POST /api/company/login
// @desc    Login company
// @access  Public
router.post('/login', 
  CompanyProfileDataRules.loginValidation(),
  validate,
  companyProfileController.login
);

// @route   GET /api/company/profile
// @desc    Get company profile
// @access  Private (Company only)
router.get(
  '/profile', 
  auth, 
  roleCheck('company'), 
  companyProfileController.getProfile
);

// @route   PUT /api/company/profile
// @desc    Update company profile
// @access  Private (Company only)
router.put(
  '/profile',
  auth,
  roleCheck('company'),
  CompanyProfileDataRules.updateValidation(),
  validate,
  companyProfileController.updateProfile
);

// @route   DELETE /api/company/profile
// @desc    Delete company profile
// @access  Private (Company only)
router.delete(
  '/profile',
  auth,
  roleCheck('company'),
  companyProfileController.deleteProfile
);

// @route   GET /api/company/all
// @desc    Get all companies (with pagination)
// @access  Public (or Admin only)
router.get('/all', 
  CompanyProfileDataRules.getAllValidation(),
  validate,
  companyProfileController.getAllCompanies
);

// @route   GET /api/company/:id
// @desc    Get company by ID
// @access  Public
router.get('/:id', 
  CompanyProfileDataRules.getByIdValidation(),
  validate,
  companyProfileController.getCompanyById
);

module.exports = router;