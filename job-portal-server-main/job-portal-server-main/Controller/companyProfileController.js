const CompanyProfile = require('../models/companyProfile');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const companyProfileController = {
    register: async (req, res) => {
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
            const existingCompany = await CompanyProfile.findByEmail(req.body.company_mail_id);
            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    message: 'Company email already registered'
                });
            }

            const newCompany = await CompanyProfile.create(req.body);
            
            const token = jwt.sign(
                { 
                    id: newCompany.id, 
                    role: newCompany.role,
                    email: newCompany.company_mail_id
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Company registered successfully',
                data: {
                    token,
                    company: {
                        id: newCompany.id,
                        name: newCompany.company_name,
                        email: newCompany.company_mail_id,
                        role: newCompany.role
                    }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error',
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