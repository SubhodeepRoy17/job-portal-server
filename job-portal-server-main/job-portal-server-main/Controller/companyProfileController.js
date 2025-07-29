const CompanyProfile = require('../models/companyProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { toast } = require('react-toastify');

const companyProfileController = {
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        try {
            const {
                full_name,
                company_mail_id,
                password,
                company_name,
                about_company,
                organizations_type,
                industry_type,
                team_size,
                year_of_establishment,
                company_website,
                company_app_link,
                company_vision,
                linkedin_url,
                instagram_url,
                facebook_url,
                youtube_url,
                custom_link,
                map_location_url,
                headquarter_phone_no,
                email_id
            } = req.body;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Create company profile
            const newCompany = await CompanyProfile.create({
                full_name,
                company_mail_id,
                password: hashedPassword,
                company_name,
                about_company,
                organizations_type,
                industry_type,
                team_size,
                year_of_establishment,
                company_website,
                company_app_link,
                company_vision,
                linkedin_url,
                instagram_url,
                facebook_url,
                youtube_url,
                custom_link,
                map_location_url,
                headquarter_phone_no,
                email_id: email_id || company_mail_id
            });

            // Generate JWT token
            const token = jwt.sign(
                { id: newCompany.id, role: newCompany.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            toast.success('Company registered successfully!');
            
            res.status(201).json({
                success: true,
                message: 'Company registered successfully',
                company: {
                    id: newCompany.id,
                    company_name: newCompany.company_name,
                    company_mail_id: newCompany.company_mail_id,
                    role: newCompany.role
                },
                token
            });

        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Failed to register company');
            res.status(500).json({ 
                success: false,
                message: 'Server error',
                error: error.message 
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const company = await CompanyProfile.findById(req.company.id);
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }
            
            // Don't send password in response
            const { password, ...profileData } = company;
            
            res.status(200).json(profileData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const updatedCompany = await CompanyProfile.update(req.company.id, req.body);
            
            // Don't send password in response
            const { password, ...profileData } = updatedCompany;
            
            res.status(200).json({
                message: 'Profile updated successfully',
                company: profileData
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    deleteProfile: async (req, res) => {
        try {
            await CompanyProfile.delete(req.company.id);
            res.status(200).json({ message: 'Company profile deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getAllCompanies: async (req, res) => {
        try {
            const companies = await CompanyProfile.getAll();
            
            // Remove passwords from response
            const sanitizedCompanies = companies.map(company => {
                const { password, ...companyData } = company;
                return companyData;
            });
            
            res.status(200).json(sanitizedCompanies);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = companyProfileController;