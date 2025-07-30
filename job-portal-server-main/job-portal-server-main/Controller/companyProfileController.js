//job-portal-server-main/job-portal-server-main/Controller/companyProfileController.js
const CompanyProfile = require('../Model/companyProfile');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const companyProfileController = {
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array()); // Debug
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        try {
            console.log('Raw request body:', req.body);

            // Ensure all required fields exist
            const requiredFields = ['email', 'password', 'companyName', 'organizationType', 
                                 'industryType', 'teamSize', 'yearEstablished', 'phoneNumber'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing required field: ${field}`
                    });
                }
            }

            const profileData = {
                full_name: req.body.fullName || req.body.companyName,
                company_mail_id: req.body.email,
                password: req.body.password,
                company_name: req.body.companyName,
                organizations_type: req.body.organizationType,
                industry_type: req.body.industryType,
                team_size: req.body.teamSize,
                year_of_establishment: req.body.yearEstablished,
                headquarter_phone_no: req.body.phoneNumber,
                // Optional fields
                company_logo_url: req.body.companyLogoUrl || null,
                company_banner_url: req.body.companyBannerUrl || null,
                about_company: req.body.aboutUs || '',
                email_id: req.body.email // Match DB column
            };

            const newCompany = await CompanyProfile.create(profileData);
            const token = jwt.sign(
                { id: newCompany.id, role: newCompany.role, email: newCompany.company_mail_id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Company registered successfully',
                data: { token, company: newCompany }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Registration failed. Please check server logs.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    login: async (req, res) => {
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
            const { company_mail_id, password } = req.body;
            const company = await CompanyProfile.findByEmail(company_mail_id);

            if (!company) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isMatch = await bcrypt.compare(password, company.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { 
                    id: company.id, 
                    role: company.role,
                    email: company.company_mail_id
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    company: {
                        id: company.id,
                        name: company.company_name,
                        email: company.company_mail_id,
                        role: company.role
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const company = await CompanyProfile.getProfileById(req.user.id);
            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            res.status(200).json({
                success: true,
                data: company
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error',
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