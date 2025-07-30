//job-portal-server-main/job-portal-server-main/Controller/companyProfileController.js
const CompanyProfile = require('../Model/companyProfile');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const companyProfileController = {
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors: errors.array() 
            });
        }

        try {
            // Ensure phone number is clean
            const cleanPhone = req.body.headquarter_phone_no?.replace(/\D/g, '') || null;

            const profileData = {
            full_name: req.body.full_name,
            company_mail_id: req.body.company_mail_id,
            password: req.body.password,
            company_logo_url: req.body.company_logo_url || null,
            company_banner_url: req.body.company_banner_url || null,
            company_name: req.body.company_name,
            about_company: req.body.about_company,
            organizations_type: req.body.organizations_type,
            industry_type: req.body.industry_type,
            team_size: req.body.team_size,
            year_of_establishment: req.body.year_of_establishment,
            company_website: req.body.company_website || null,
            company_vision: req.body.company_vision || null,
            headquarter_phone_no: cleanPhone, // Use cleaned phone
            facebook_url: req.body.facebook_url || null,
            twitter_url: req.body.twitter_url || null,
            instagram_url: req.body.instagram_url || null,
            youtube_url: req.body.youtube_url || null,
            role: 4 // Default company role
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