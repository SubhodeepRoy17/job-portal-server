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
                socialLinks: {
                    linkedin: company.linkedin_url,
                    facebook: company.facebook_url,
                    youtube: company.youtube_url,
                    instagram: company.instagram_url
                },
                customLink: company.custom_link,
                mapLocation: company.map_location_url,
                emailId: company.email_id
            };

            console.log(`Successfully fetched profile for company ID: ${companyId}`);
            res.status(200).json({
                success: true,
                message: 'Company profile retrieved successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Error fetching company profile:', {
                message: error.message,
                stack: error.stack,
                companyId: req.params.id,
                timestamp: new Date().toISOString()
            });

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
            // Prepare update data
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
                facebook_url: req.body.facebook_url || null,
                youtube_url: req.body.youtube_url || null,
                instagram_url: req.body.instagram_url || null,
                linkedin_url: req.body.linkedin_url || null,
                custom_link: req.body.custom_link || null,
                map_location_url: req.body.map_location_url || null,
                company_app_link: req.body.company_app_link || null
            };

            // Handle date formatting if provided
            if (req.body.year_of_establishment) {
                updateData.year_of_establishment = new Date(req.body.year_of_establishment).toISOString();
            }

            // Handle file uploads if provided
            if (req.body.company_logo_url) {
                updateData.company_logo_url = req.body.company_logo_url;
            }
            if (req.body.company_banner_url) {
                updateData.company_banner_url = req.body.company_banner_url;
            }

            console.log('Updating company profile with:', updateData);

            // Build the dynamic UPDATE query
            const setClauses = [];
            const values = [];
            let valueIndex = 1;

            Object.entries(updateData).forEach(([key, value]) => {
                if (value !== undefined) {
                    setClauses.push(`${key} = $${valueIndex}`);
                    values.push(value);
                    valueIndex++;
                }
            });

            if (setClauses.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields provided for update'
                });
            }

            values.push(req.user.id); // Add ID as last parameter
            const query = `
                UPDATE company_profile 
                SET ${setClauses.join(', ')}
                WHERE id = $${valueIndex}
                RETURNING 
                    id, full_name, company_mail_id, role,
                    company_logo_url, company_banner_url, company_name,
                    about_company, organizations_type, industry_type,
                    team_size, year_of_establishment, company_website,
                    company_app_link, company_vision, linkedin_url,
                    instagram_url, facebook_url, youtube_url, custom_link,
                    map_location_url, headquarter_phone_no
            `;

            const { rows } = await pool.query(query, values);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }

            const updatedCompany = rows[0];

            // Format the response
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
                socialLinks: {
                    linkedin: updatedCompany.linkedin_url,
                    facebook: updatedCompany.facebook_url,
                    youtube: updatedCompany.youtube_url,
                    instagram: updatedCompany.instagram_url
                },
                customLink: updatedCompany.custom_link,
                mapLocation: updatedCompany.map_location_url
            };

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Update profile error:', {
                message: error.message,
                stack: error.stack,
                query: error.query,
                parameters: error.parameters
            });
            
            res.status(500).json({ 
                success: false,
                message: 'Profile update failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = companyProfileController;