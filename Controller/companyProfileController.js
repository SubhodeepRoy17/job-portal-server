//job-portal-server-main/job-portal-server-main/Controller/companyProfileController.js
const CompanyProfile = require('../Model/companyProfile');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { pool } = require('../Utils/DBconnect');

const companyProfileController = {
    register: async (req, res) => {
        console.log('Incoming registration data:', req.body); // Debug log
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Validation errors:', errors.array());
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        try {
            // Clean and validate data
            const cleanPhone = req.body.headquarter_phone_no?.replace(/\D/g, '') || null;
            const establishmentDate = req.body.year_of_establishment 
                ? new Date(req.body.year_of_establishment).toISOString() 
                : null;

            const profileData = {
                full_name: req.body.full_name || req.body.company_name,
                company_mail_id: req.body.company_mail_id,
                password: req.body.password,
                company_logo_url: req.body.company_logo_url || null,
                company_banner_url: req.body.company_banner_url || null,
                company_name: req.body.company_name,
                about_company: req.body.about_company,
                organizations_type: req.body.organizations_type,
                industry_type: req.body.industry_type,
                team_size: req.body.team_size,
                year_of_establishment: establishmentDate,
                company_website: req.body.company_website || null,
                company_vision: req.body.company_vision || null,
                headquarter_phone_no: cleanPhone,
                social_links: {
                    linkedin: req.body.linkedin_url || null,
                    facebook: req.body.facebook_url || null,
                    twitter: req.body.twitter_url || null,
                    instagram: req.body.instagram_url || null,
                    youtube: req.body.youtube_url || null,
                    github: req.body.github_url || null,
                    glassdoor: req.body.glassdoor_url || null,
                    crunchbase: req.body.crunchbase_url || null
                },
                careers_link: req.body.careers_link || null,
                role: 4
            };

            console.log('Processed profile data:', profileData); // Debug log

            const newCompany = await CompanyProfile.create(profileData);
            const token = jwt.sign(
                { id: newCompany.id, role: newCompany.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Company registered successfully',
                data: { token, company: newCompany }
            });

        } catch (error) {
            console.error('FULL REGISTRATION ERROR:', {
                message: error.message,
                stack: error.stack,
                query: error.query,
                parameters: error.parameters
            });
            res.status(500).json({ 
                success: false,
                message: 'Registration failed. ' + error.message
            });
        }
    },

    login: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                errors: errors.array()
            });
        }

        try {
            const { company_mail_id, password } = req.body;
            
            const company = await CompanyProfile.findByEmail(company_mail_id);
            
            if (!company) {
                return res.status(401).json({
                    success: false,
                    message: 'No account found with this email',
                    errorCode: 'ACCOUNT_NOT_FOUND'
                });
            }

            const isMatch = await bcrypt.compare(password, company.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password',
                    errorCode: 'INVALID_PASSWORD'
                });
            }

            // Token generation and success response remains the same
            const tokenPayload = {
                id: company.id,
                role: company.role,
                email: company.company_mail_id
            };

            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            const responseData = {
                id: company.id,
                company_name: company.company_name,
                company_mail_id: company.company_mail_id,
                role: company.role
            };

            if (company.company_logo_url) {
                responseData.company_logo_url = company.company_logo_url;
            }

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    company: responseData
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Authentication server error',
                errorCode: 'AUTH_SERVER_ERROR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getCompanyProfile: async (req, res) => {
        try {
            const companyId = req.params.id;
            console.log(`Fetching profile for company ID: ${companyId}`);

            const company = await CompanyProfile.getProfileById(companyId);
            
            if (!company) {
                console.log(`Company not found with ID: ${companyId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Company profile not found'
                });
            }

            // Format the response data
            const responseData = {
                id: company.id,
                fullName: company.full_name,
                email: company.company_mail_id,
                role: company.role,
                name: company.company_name,
                about: company.about_company,
                logo: company.company_logo_url,
                banner: company.company_banner_url,
                website: company.company_website,
                appLink: company.company_app_link,
                vision: company.company_vision,
                industry: company.industry_type,
                organizationType: company.organizations_type,
                teamSize: company.team_size,
                founded: company.year_of_establishment,
                phone: company.headquarter_phone_no,
                socialLinks: company.social_links || {}, // Now using the JSONB column
                careersLink: company.careers_link || null,
                customLink: company.custom_link || null, // Removed duplicate
                mapLocation: company.map_location_url || null,
                emailId: company.email_id || null
            };

            console.log(`Successfully fetched profile for company ID: ${companyId}`);
            res.status(200).json({
                success: true,
                message: 'Company profile retrieved successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Error fetching company profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch company profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    updateProfile: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        try {
            // Prepare update data with social_links as JSON object
            const updateData = {
                full_name: req.body.full_name || req.body.company_name,
                company_name: req.body.company_name,
                about_company: req.body.about_company,
                organizations_type: req.body.organizations_type,
                industry_type: req.body.industry_type,
                team_size: req.body.team_size,
                company_website: req.body.company_website || null,
                company_vision: req.body.company_vision || null,
                headquarter_phone_no: req.body.headquarter_phone_no?.replace(/\D/g, '') || null,
                social_links: {
                    linkedin: req.body.linkedin_url || null,
                    facebook: req.body.facebook_url || null,
                    twitter: req.body.twitter_url || null,
                    instagram: req.body.instagram_url || null,
                    youtube: req.body.youtube_url || null,
                    github: req.body.github_url || null,
                    glassdoor: req.body.glassdoor_url || null,
                    crunchbase: req.body.crunchbase_url || null
                },
                careers_link: req.body.careers_link || null,
                custom_link: req.body.custom_link || null,
                map_location_url: req.body.map_location_url || null,
                company_app_link: req.body.company_app_link || null,
                company_logo_url: req.body.company_logo_url || null,
                company_banner_url: req.body.company_banner_url || null
            };

            // Handle date formatting if provided
            if (req.body.year_of_establishment) {
                updateData.year_of_establishment = new Date(req.body.year_of_establishment).toISOString();
            }

            console.log('Updating company profile with:', updateData);

            // Update using the model method instead of direct pool query
            const updatedCompany = await CompanyProfile.updateProfile(req.user.id, updateData);
            
            if (!updatedCompany) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            // Format the response with social_links
            const responseData = {
                id: updatedCompany.id,
                name: updatedCompany.company_name,
                email: updatedCompany.company_mail_id,
                about: updatedCompany.about_company,
                logo: updatedCompany.company_logo_url,
                banner: updatedCompany.company_banner_url,
                website: updatedCompany.company_website,
                vision: updatedCompany.company_vision,
                industry: updatedCompany.industry_type,
                organizationType: updatedCompany.organizations_type,
                teamSize: updatedCompany.team_size,
                founded: updatedCompany.year_of_establishment,
                phone: updatedCompany.headquarter_phone_no,
                appLink: updatedCompany.company_app_link,
                socialLinks: updatedCompany.social_links || {}, // Now using the JSONB column
                customLink: updatedCompany.custom_link || null,
                mapLocation: updatedCompany.map_location_url || null,
                careersLink: updatedCompany.careers_link || null
            };

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Profile update failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = companyProfileController;