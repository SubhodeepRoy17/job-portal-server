const { pool } = require("../Utils/DBconnect");

async function createCompanyProfileTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS main_company_profile (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            company_name VARCHAR(100) NOT NULL,
            about TEXT,
            company_logo VARCHAR(255),
            banner_logo VARCHAR(255),
            organization_type VARCHAR(50) CHECK (
                organization_type IN (
                    'Sole Proprietor',
                    'Private Limited (Pvt Ltd)',
                    'Limited (Ltd)',
                    'One Person Company (OPC)',
                    'Limited Liability Partnership (LLP)',
                    'Incorporated (Inc)',
                    'Corporation'
                )
            ),
            industry_type VARCHAR(50) CHECK (
                industry_type IN (
                    'Fintech',
                    'Engineering',
                    'Software & IT',
                    'Edutech',
                    'Oil and Gas',
                    'Other'
                )
            ),
            team_size VARCHAR(20) CHECK (
                team_size IN (
                    '1-10',
                    '10-50',
                    '50-100',
                    '100-300',
                    '300-1000',
                    '2000-10000'
                )
            ),
            year_of_establishment INTEGER CHECK (
                year_of_establishment BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)
            ),
            careers_link VARCHAR(255),
            company_vision TEXT,
            map_location VARCHAR(255),
            social_links JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

async function getCompanyProfile(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM main_company_profile WHERE user_id = $1",
        [userId]
    );
    return rows[0];
}

async function createCompanyProfile(profileData) {
    const { rows } = await pool.query(
        `INSERT INTO main_company_profile (
            user_id, company_name, about, company_logo, banner_logo,
            organization_type, industry_type, team_size, year_of_establishment,
            careers_link, company_vision, map_location, social_links
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
            profileData.user_id,
            profileData.company_name,
            profileData.about,
            profileData.company_logo,
            profileData.banner_logo,
            profileData.organization_type,
            profileData.industry_type,
            profileData.team_size,
            profileData.year_of_establishment,
            profileData.careers_link,
            profileData.company_vision,
            profileData.map_location,
            profileData.social_links
        ]
    );
    return rows[0];
}

async function updateCompanyProfile(userId, profileData) {
    const { rows } = await pool.query(
        `UPDATE main_company_profile SET
            company_name = $1,
            about = $2,
            company_logo = $3,
            banner_logo = $4,
            organization_type = $5,
            industry_type = $6,
            team_size = $7,
            year_of_establishment = $8,
            careers_link = $9,
            company_vision = $10,
            map_location = $11,
            social_links = $12,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $13
        RETURNING *`,
        [
            profileData.company_name,
            profileData.about,
            profileData.company_logo,
            profileData.banner_logo,
            profileData.organization_type,
            profileData.industry_type,
            profileData.team_size,
            profileData.year_of_establishment,
            profileData.careers_link,
            profileData.company_vision,
            profileData.map_location,
            profileData.social_links,
            userId
        ]
    );
    return rows[0];
}

module.exports = {
    createCompanyProfileTable,
    getCompanyProfile,
    createCompanyProfile,
    updateCompanyProfile
};