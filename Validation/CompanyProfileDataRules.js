const { body } = require('express-validator');
const { pool } = require("../Utils/DBconnect");

module.exports = {
    registerValidation: () => [
        body('company_name').notEmpty().withMessage('Company name is required'),
        body('company_mail_id')
            .isEmail().withMessage('Invalid email format')
            .custom(async (email) => {
                const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
                const domain = email.split('@')[1];
                
                if (publicDomains.includes(domain)) {
                    throw new Error('Public email domains are not allowed');
                }

                const exists = await pool.query(
                    'SELECT 1 FROM company_profile WHERE company_mail_id = $1', 
                    [email]
                );
                if (exists.rows.length) throw new Error('Email already registered');
            }),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('headquarter_phone_no')
            .optional()
            .customSanitizer(value => value ? value.replace(/\D/g, '') : null)
            .isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 digits'),
        
        // Social links validation for registration
        body('linkedin_url').optional().isURL().withMessage('Invalid LinkedIn URL'),
        body('facebook_url').optional().isURL().withMessage('Invalid Facebook URL'),
        body('twitter_url').optional().isURL().withMessage('Invalid Twitter URL'),
        body('instagram_url').optional().isURL().withMessage('Invalid Instagram URL'),
        body('youtube_url').optional().isURL().withMessage('Invalid YouTube URL'),
        body('github_url').optional().isURL().withMessage('Invalid GitHub URL'),
        body('glassdoor_url').optional().isURL().withMessage('Invalid Glassdoor URL'),
        body('crunchbase_url').optional().isURL().withMessage('Invalid Crunchbase URL')
    ],

    loginValidation: () => [
        body('company_mail_id')
            .isEmail().withMessage('Please enter a valid email address')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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
            .isIn(['Fintech', 'Engineering', 'Software & IT', 'Edutech', 'oil and gas', 'other'])
            .withMessage('Invalid industry type'),
        
        body('team_size')
            .optional()
            .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
            .withMessage('Invalid team size'),
        
        body('year_of_establishment')
            .optional()
            .isISO8601()
            .withMessage('Must be valid ISO date (YYYY-MM-DD)'),
        
        body('headquarter_phone_no')
            .optional()
            .isMobilePhone().withMessage('Invalid phone number'),

        body('careers_link')
            .optional()
            .isURL().withMessage('Must be a valid URL'),
        
        // Social links validation for update
        body('linkedin_url').optional().isURL().withMessage('Invalid LinkedIn URL'),
        body('facebook_url').optional().isURL().withMessage('Invalid Facebook URL'),
        body('twitter_url').optional().isURL().withMessage('Invalid Twitter URL'),
        body('instagram_url').optional().isURL().withMessage('Invalid Instagram URL'),
        body('youtube_url').optional().isURL().withMessage('Invalid YouTube URL'),
        body('github_url').optional().isURL().withMessage('Invalid GitHub URL'),
        body('glassdoor_url').optional().isURL().withMessage('Invalid Glassdoor URL'),
        body('crunchbase_url').optional().isURL().withMessage('Invalid Crunchbase URL')
    ],

    // Optional: Add a custom validator for the complete social_links object
    validateSocialLinks: () => [
        body('social_links')
            .optional()
            .isObject()
            .custom(value => {
                const validPlatforms = [
                    'linkedin', 'facebook', 'twitter', 
                    'instagram', 'youtube', 'github',
                    'glassdoor', 'crunchbase'
                ];
                
                for (const platform in value) {
                    if (!validPlatforms.includes(platform)) {
                        throw new Error(`Invalid social platform: ${platform}`);
                    }
                    if (value[platform] && !/^https?:\/\/.+\..+/.test(value[platform])) {
                        throw new Error(`Invalid URL for ${platform}`);
                    }
                }
                return true;
            })
    ]
};