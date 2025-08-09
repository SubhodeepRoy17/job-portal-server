const { body } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const organizationTypes = [
    'Sole Proprietor',
    'Private Limited (Pvt Ltd)',
    'Limited (Ltd)',
    'One Person Company (OPC)',
    'Limited Liability Partnership (LLP)',
    'Incorporated (Inc)',
    'Corporation'
];

const industryTypes = [
    'Fintech',
    'Engineering',
    'Software & IT',
    'Edutech',
    'Oil and Gas',
    'Other'
];

const teamSizes = [
    '1-10',
    '10-50',
    '50-100',
    '100-300',
    '300-1000',
    '2000-10000'
];

exports.checkCompanyProfileInput = [
    body("company_name")
        .notEmpty().withMessage("Company name is required")
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Company name must be between 2-100 characters")
        .escape(),

    body("about")
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage("About cannot exceed 2000 characters")
        .customSanitizer(value => sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {}
        })),

    body("company_logo")
        .optional()
        .trim()
        .isURL().withMessage("Company logo must be a valid URL")
        .matches(/^https?:\/\//).withMessage("URL must start with http:// or https://"),

    body("banner_logo")
        .optional()
        .trim()
        .isURL().withMessage("Banner logo must be a valid URL")
        .matches(/^https?:\/\//).withMessage("URL must start with http:// or https://"),

    body("organization_type")
        .optional()
        .isIn(organizationTypes).withMessage("Invalid organization type"),

    body("industry_type")
        .optional()
        .isIn(industryTypes).withMessage("Invalid industry type"),

    body("team_size")
        .optional()
        .isIn(teamSizes).withMessage("Invalid team size"),

    body("year_of_establishment")
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage(`Year must be between 1900-${new Date().getFullYear()}`),

    body("careers_link")
        .optional()
        .trim()
        .isURL().withMessage("Careers link must be a valid URL")
        .matches(/^https?:\/\//).withMessage("URL must start with http:// or https://"),

    body("company_vision")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Company vision cannot exceed 1000 characters")
        .customSanitizer(value => sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {}
        })),

    body("map_location")
        .optional()
        .trim()
        .isURL().withMessage("Map location must be a valid URL")
        .matches(/^https?:\/\//).withMessage("URL must start with http:// or https://"),

    body("social_links")
        .optional()
        .isObject().withMessage("Social links must be an object")
        .custom((socialLinks) => {
            if (socialLinks) {
                for (const [key, value] of Object.entries(socialLinks)) {
                    if (value && typeof value === 'string' && !value.startsWith('https://')) {
                        throw new Error(`Social link for ${key} must start with https://`);
                    }
                }
            }
            return true;
        })
];