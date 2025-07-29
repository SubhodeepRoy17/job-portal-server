//job-portal-server-main/job-portal-server-main/Validation/CompanyProfileDataRules.js

const { body } = require("express-validator");
const pool = require("../config/db");

exports.checkCompanyRegistrationInput = [
    body("full_name")
        .notEmpty().withMessage("Full name is required")
        .isLength({ max: 255 }).withMessage("Full name too long")
        .trim().escape(),
        
    body("company_mail_id")
        .notEmpty().withMessage("Company email is required")
        .isEmail().withMessage("Invalid company email")
        .custom((value) => {
            const blockedDomains = [
                'gmail.com',
                'yahoo.com',
                'outlook.com',
                'hotmail.com',
                'icloud.com',
                'protonmail.com'
            ];
            const domain = value.split('@')[1];
            if (blockedDomains.includes(domain)) {
                throw new Error('Personal email addresses are not allowed');
            }
            return true;
        })
        .custom(async (value) => {
            const { rows } = await pool.query(
                'SELECT 1 FROM company_profile WHERE company_mail_id = $1',
                [value]
            );
            if (rows.length > 0) {
                throw new Error('Company email already registered');
            }
            return true;
        }),
        
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage("Password must contain at least one uppercase, one lowercase, one number and one special character"),
        
    body("company_name")
        .notEmpty().withMessage("Company name is required")
        .isLength({ max: 255 }).withMessage("Company name too long")
        .trim().escape(),
        
    body("about_company")
        .optional()
        .isString().withMessage("About company must be text")
        .trim(),
        
    body("organizations_type")
        .notEmpty().withMessage("Organization type is required")
        .isIn(["solo proprietor", "pvt LTD", "LTD", "OPC", "LLP", "INC", "Corporation"])
        .withMessage("Invalid organization type"),
        
    body("industry_type")
        .notEmpty().withMessage("Industry type is required")
        .isIn(["Fintech", "Engineering", "Software & IT", "edutech", "oil and gas", "other"])
        .withMessage("Invalid industry type"),
        
    body("team_size")
        .notEmpty().withMessage("Team size is required")
        .isIn(["1-10", "10-50", "50-100", "100-300", "300-1000", "2000-10000"])
        .withMessage("Invalid team size"),
        
    body("year_of_establishment")
        .notEmpty().withMessage("Year of establishment is required")
        .isInt({ min: 1800, max: new Date().getFullYear() })
        .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),
        
    body("company_website")
        .optional()
        .isURL().withMessage("Invalid website URL"),
        
    body("company_app_link")
        .optional()
        .isURL().withMessage("Invalid app link"),
        
    body("company_vision")
        .optional()
        .isString().withMessage("Company vision must be text")
        .trim(),
        
    body("linkedin_url")
        .optional()
        .isURL().withMessage("Invalid LinkedIn URL"),
        
    body("instagram_url")
        .optional()
        .isURL().withMessage("Invalid Instagram URL"),
        
    body("facebook_url")
        .optional()
        .isURL().withMessage("Invalid Facebook URL"),
        
    body("youtube_url")
        .optional()
        .isURL().withMessage("Invalid YouTube URL"),
        
    body("custom_link")
        .optional()
        .isURL().withMessage("Invalid custom URL"),
        
    body("map_location_url")
        .optional()
        .isURL().withMessage("Invalid map URL"),
        
    body("headquarter_phone_no")
        .notEmpty().withMessage("Phone number is required")
        .isMobilePhone().withMessage("Invalid phone number"),
        
    body("email_id")
        .optional()
        .isEmail().withMessage("Invalid email")
        .custom((value) => {
            const blockedDomains = [
                'gmail.com',
                'yahoo.com',
                'outlook.com',
                'hotmail.com'
            ];
            const domain = value.split('@')[1];
            if (blockedDomains.includes(domain)) {
                throw new Error('Personal email addresses are not allowed');
            }
            return true;
        })
];