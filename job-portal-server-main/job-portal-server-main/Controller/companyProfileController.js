//job-portal-server-main/job-portal-server-main/Controller/companyProfileController.js
const CompanyProfile = require('../Model/companyProfile');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

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
                facebook_url: req.body.facebook_url || null,
                twitter_url: req.body.twitter_url || null,
                instagram_url: req.body.instagram_url || null,
                youtube_url: req.body.youtube_url || null,
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

    // In the login method of companyProfileController.js
    login: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Login validation errors:', errors.array());
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        try {
            const { company_mail_id, password } = req.body;
            
            // More detailed logging
            console.log(`Login attempt for: ${company_mail_id}`);
            
            const company = await CompanyProfile.findByEmail(company_mail_id);

            if (!company) {
                console.log(`Login failed - company not found: ${company_mail_id}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password' // Generic message for security
                });
            }

            const isMatch = await bcrypt.compare(password, company.password);
            if (!isMatch) {
                console.log(`Login failed - password mismatch for: ${company_mail_id}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password' // Generic message for security
                });
            }

            // Enhanced token payload
            const tokenPayload = {
                id: company.id,
                role: company.role,
                email: company.company_mail_id,
                name: company.company_name
            };

            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Response without sensitive data
            const responseData = {
                id: company.id,
                company_name: company.company_name,
                company_mail_id: company.company_mail_id,
                role: company.role,
                company_logo_url: company.company_logo_url
            };

            console.log(`Successful login for company ID: ${company.id}`);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    company: responseData
                }
            });

        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            res.status(500).json({ 
                success: false,
                message: 'Authentication server error'
            });
        }
    },

    updateProfile: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        try {
            const updatedCompany = await CompanyProfile.updateProfile(req.user.id, req.body);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedCompany
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = companyProfileController;