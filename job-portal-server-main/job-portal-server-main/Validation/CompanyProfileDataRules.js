//job-portal-server-main/job-portal-server-main/Validation/CompanyProfileDataRules.js
const { body } = require('express-validator');
const { pool } = require("../Utils/DBconnect");

module.exports = {
    registerValidation: () => [
        body('companyName')
            .trim()
            .notEmpty().withMessage('Company name is required')
            .isLength({ max: 255 }),
        
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail()
            .custom(async (email) => {
                const { rows } = await pool.query(
                    'SELECT 1 FROM company_profile WHERE company_mail_id = $1 OR email_id = $1',
                    [email]
                );
                if (rows.length > 0) throw new Error('Email already registered');
                return true;
            }),
        
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }),
        
        body('organizationType')
            .notEmpty().withMessage('Organization type is required')
            .isIn(['startup', 'corporation', 'nonprofit', 'government', 'agency']),
        
        body('industryType')
            .notEmpty().withMessage('Industry type is required')
            .isIn(['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing']),
        
        body('teamSize')
            .notEmpty().withMessage('Team size is required')
            .isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
        
        body('yearEstablished')
            .notEmpty().withMessage('Year of establishment is required')
            .isInt({ min: 1800, max: new Date().getFullYear() }),
        
        body('phoneNumber')
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone()
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