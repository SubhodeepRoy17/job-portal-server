// validators/CompanyProfileDataRules.js
const { body } = require('express-validator');
const pool = require('../config/db');

module.exports = {
    registerValidation: () => [
        body('full_name')
            .trim()
            .notEmpty().withMessage('Full name is required')
            .isLength({ max: 255 }).withMessage('Full name cannot exceed 255 characters'),
        
        body('company_mail_id')
            .trim()
            .notEmpty().withMessage('Company email is required')
            .isEmail().withMessage('Invalid email format')
            .custom(async (email) => {
                const { rows } = await pool.query(
                    'SELECT 1 FROM company_profile WHERE company_mail_id = $1',
                    [email]
                );
                if (rows.length > 0) {
                    throw new Error('Email already registered');
                }
                return true;
            }),
        
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
        
        body('company_name')
            .trim()
            .notEmpty().withMessage('Company name is required')
            .isLength({ max: 255 }).withMessage('Company name cannot exceed 255 characters'),
        
        body('organizations_type')
            .notEmpty().withMessage('Organization type is required')
            .isIn(['solo proprietor', 'pvt LTD', 'LTD', 'OPC', 'LLP', 'INC', 'Corporation'])
            .withMessage('Invalid organization type'),
        
        body('industry_type')
            .notEmpty().withMessage('Industry type is required')
            .isIn(['Fintech', 'Engineering', 'Software & IT', 'edutech', 'oil and gas', 'other'])
            .withMessage('Invalid industry type'),
        
        body('team_size')
            .notEmpty().withMessage('Team size is required')
            .isIn(['1-10', '10-50', '50-100', '100-300', '300-1000', '2000-10000'])
            .withMessage('Invalid team size'),
        
        body('year_of_establishment')
            .notEmpty().withMessage('Year of establishment is required')
            .isInt({ min: 1800, max: new Date().getFullYear() })
            .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),
        
        body('headquarter_phone_no')
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Invalid phone number')
    ],

    loginValidation: () => [
        body('company_mail_id')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format'),
        
        body('password')
            .notEmpty().withMessage('Password is required')
    ],

    updateValidation: () => [
        body('full_name')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('Full name cannot exceed 255 characters'),
        
        body('company_name')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('Company name cannot exceed 255 characters'),
        
        body('organizations_type')
            .optional()
            .isIn(['solo proprietor', 'pvt LTD', 'LTD', 'OPC', 'LLP', 'INC', 'Corporation'])
            .withMessage('Invalid organization type'),
        
        body('industry_type')
            .optional()
            .isIn(['Fintech', 'Engineering', 'Software & IT', 'edutech', 'oil and gas', 'other'])
            .withMessage('Invalid industry type'),
        
        body('team_size')
            .optional()
            .isIn(['1-10', '10-50', '50-100', '100-300', '300-1000', '2000-10000'])
            .withMessage('Invalid team size'),
        
        body('year_of_establishment')
            .optional()
            .isInt({ min: 1800, max: new Date().getFullYear() })
            .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),
        
        body('headquarter_phone_no')
            .optional()
            .isMobilePhone().withMessage('Invalid phone number')
    ]
};