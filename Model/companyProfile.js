//job-portal-server-main/job-portal-server-main/Model/companyProfile.js
const { pool } = require("../Utils/DBconnect");
const bcrypt = require("bcrypt");

const CompanyProfile = {
    async create(profileData) {
        const client = await pool.connect();
        try {
            console.log('Executing query with:', profileData);
            
            await client.query('BEGIN');
            const query = `
                INSERT INTO company_profile (
                    full_name, company_mail_id, password, role,
                    company_logo_url, company_banner_url, company_name,
                    about_company, organizations_type, industry_type,
                    team_size, year_of_establishment, company_website,
                    company_vision, headquarter_phone_no
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7,
                    $8, $9, $10,
                    $11, $12, $13,
                    $14, $15
                )
                RETURNING id, company_name, company_mail_id, role
            `;

            const values = [
                profileData.full_name,
                profileData.company_mail_id,
                await bcrypt.hash(profileData.password, 12),
                4,
                profileData.company_logo_url,
                profileData.company_banner_url,
                profileData.company_name,
                profileData.about_company,
                profileData.organizations_type,
                profileData.industry_type,
                profileData.team_size,
                profileData.year_of_establishment,
                profileData.company_website,
                profileData.company_vision,
                profileData.headquarter_phone_no
            ];

            const { rows } = await client.query(query, values);
            await client.query('COMMIT');
            return rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('DATABASE ERROR DETAILS:', {
                query: error.query,
                parameters: error.parameters,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    },

    async findByEmail(company_mail_id) {
        try {
            const query = `
                SELECT 
                    id, 
                    full_name, 
                    company_mail_id, 
                    password, 
                    role,
                    company_logo_url, 
                    company_banner_url, 
                    company_name,
                    about_company, 
                    organizations_type, 
                    industry_type,
                    team_size, 
                    year_of_establishment, 
                    company_website,
                    company_vision,
                    facebook_url,
                    instagram_url, 
                    youtube_url, 
                    headquarter_phone_no
                FROM company_profile 
                WHERE LOWER(company_mail_id) = LOWER($1)
            `;
            const { rows } = await pool.query(query, [company_mail_id]);
            return rows[0];
        } catch (error) {
            console.error('Database error in findByEmail:', error);
            throw error;
        }
    },

    async getProfileById(id) {
        const query = `
            SELECT id, full_name, company_mail_id, role, 
                   company_logo_url, company_banner_url, company_name,
                   about_company, organizations_type, industry_type,
                   team_size, year_of_establishment, company_website,
                   company_app_link, company_vision, linkedin_url,
                   instagram_url, facebook_url, youtube_url, custom_link,
                   map_location_url, headquarter_phone_no, email_id
            FROM company_profile 
            WHERE id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    async updateProfile(id, profileData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE company_profile 
                SET 
                    full_name = COALESCE($1, full_name),
                    company_logo_url = COALESCE($2, company_logo_url),
                    company_banner_url = COALESCE($3, company_banner_url),
                    company_name = COALESCE($4, company_name),
                    about_company = COALESCE($5, about_company),
                    organizations_type = COALESCE($6, organizations_type),
                    industry_type = COALESCE($7, industry_type),
                    team_size = COALESCE($8, team_size),
                    year_of_establishment = COALESCE($9, year_of_establishment),
                    company_website = COALESCE($10, company_website),
                    company_app_link = COALESCE($11, company_app_link),
                    company_vision = COALESCE($12, company_vision),
                    linkedin_url = COALESCE($13, linkedin_url),
                    instagram_url = COALESCE($14, instagram_url),
                    facebook_url = COALESCE($15, facebook_url),
                    youtube_url = COALESCE($16, youtube_url),
                    custom_link = COALESCE($17, custom_link),
                    map_location_url = COALESCE($18, map_location_url),
                    headquarter_phone_no = COALESCE($19, headquarter_phone_no),
                    email_id = COALESCE($20, email_id),
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
            
            const { rows } = await client.query(query, values);
            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = CompanyProfile;