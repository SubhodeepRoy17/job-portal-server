const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const CompanyProfile = {
    async create(profileData) {
        try {
            const query = `
                INSERT INTO company_profile (
                    full_name, company_mail_id, password, role, company_logo_url, 
                    company_banner_url, company_name, about_company, organizations_type, 
                    industry_type, team_size, year_of_establishment, company_website, 
                    company_app_link, company_vision, linkedin_url, instagram_url, 
                    facebook_url, youtube_url, custom_link, map_location_url, 
                    headquarter_phone_no, email_id
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                RETURNING *
            `;
            
            const hashedPassword = await bcrypt.hash(profileData.password, 12);
            
            const values = [
                profileData.full_name,
                profileData.company_mail_id,
                hashedPassword,
                4, // Company role
                profileData.company_logo_url,
                profileData.company_banner_url,
                profileData.company_name,
                profileData.about_company,
                profileData.organizations_type,
                profileData.industry_type,
                profileData.team_size,
                profileData.year_of_establishment,
                profileData.company_website,
                profileData.company_app_link,
                profileData.company_vision,
                profileData.linkedin_url,
                profileData.instagram_url,
                profileData.facebook_url,
                profileData.youtube_url,
                profileData.custom_link,
                profileData.map_location_url,
                profileData.headquarter_phone_no,
                profileData.email_id || profileData.company_mail_id
            ];
            
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async findByEmail(company_mail_id) {
        try {
            const { rows } = await pool.query('SELECT * FROM company_profile WHERE company_mail_id = $1', [company_mail_id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async findById(id) {
        try {
            const { rows } = await pool.query('SELECT * FROM company_profile WHERE id = $1', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async update(id, profileData) {
        try {
            const query = `
                UPDATE company_profile 
                SET 
                    full_name = $1,
                    company_logo_url = $2,
                    company_banner_url = $3,
                    company_name = $4,
                    about_company = $5,
                    organizations_type = $6,
                    industry_type = $7,
                    team_size = $8,
                    year_of_establishment = $9,
                    company_website = $10,
                    company_app_link = $11,
                    company_vision = $12,
                    linkedin_url = $13,
                    instagram_url = $14,
                    facebook_url = $15,
                    youtube_url = $16,
                    custom_link = $17,
                    map_location_url = $18,
                    headquarter_phone_no = $19,
                    email_id = $20,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $21
                RETURNING *
            `;
            
            const values = [
                profileData.full_name,
                profileData.company_logo_url,
                profileData.company_banner_url,
                profileData.company_name,
                profileData.about_company,
                profileData.organizations_type,
                profileData.industry_type,
                profileData.team_size,
                profileData.year_of_establishment,
                profileData.company_website,
                profileData.company_app_link,
                profileData.company_vision,
                profileData.linkedin_url,
                profileData.instagram_url,
                profileData.facebook_url,
                profileData.youtube_url,
                profileData.custom_link,
                profileData.map_location_url,
                profileData.headquarter_phone_no,
                profileData.email_id,
                id
            ];
            
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async delete(id) {
        try {
            const { rows } = await pool.query('DELETE FROM company_profile WHERE id = $1 RETURNING *', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async getAll() {
        try {
            const { rows } = await pool.query('SELECT * FROM company_profile');
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = CompanyProfile;