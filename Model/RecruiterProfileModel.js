const { pool } = require("../Utils/DBconnect");

async function createRecruiterProfileTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS recruiter_profile (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('hire', 'host_hackathon')),
            designation VARCHAR(100) NOT NULL,
            work_experience_years NUMERIC(3,1) NOT NULL,
            current_company VARCHAR(255) NOT NULL,
            company_email VARCHAR(255) NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            skills INTEGER[] DEFAULT '{}',  // New column added here
            about TEXT,
            full_address TEXT,
            social_links JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
        );
    `;
    await pool.query(query);
}

async function getRecruiterProfile(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM recruiter_profile WHERE user_id = $1",
        [userId]
    );
    return rows[0];
}

async function upsertRecruiterProfile(userId, profileData) {
    const { 
        purpose, 
        designation, 
        work_experience_years, 
        current_company, 
        company_email, 
        about, 
        full_address, 
        social_links 
    } = profileData;

    const cleanedSocialLinks = {};
    if (social_links && typeof social_links === 'object') {
        for (const [key, value] of Object.entries(social_links)) {
            if (value && typeof value === 'string' && value.startsWith('https://')) {
                cleanedSocialLinks[key] = value;
            }
        }
    }

    const query = `
        INSERT INTO recruiter_profile (
            user_id, purpose, designation, work_experience_years, 
            current_company, company_email, about, full_address, social_links
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) 
        DO UPDATE SET
            purpose = EXCLUDED.purpose,
            designation = EXCLUDED.designation,
            work_experience_years = EXCLUDED.work_experience_years,
            current_company = EXCLUDED.current_company,
            company_email = EXCLUDED.company_email,
            about = EXCLUDED.about,
            full_address = EXCLUDED.full_address,
            social_links = EXCLUDED.social_links,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    const { rows } = await pool.query(query, [
        userId, purpose, designation, work_experience_years, 
        current_company, company_email, about, 
        full_address, 
        Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null
    ]);

    return rows[0];
}

async function getRecruiterSkills(userId) {
    const { rows } = await pool.query(
        "SELECT skills FROM recruiter_profile WHERE user_id = $1",
        [userId]
    );
    return rows[0] ? rows[0].skills : [];
}

async function addRecruiterSkills(userId, skillIds) {
    const { rows: currentRows } = await pool.query(
        `SELECT skills FROM recruiter_profile WHERE user_id = $1`,
        [userId]
    );
    const currentSkills = currentRows[0] ? currentRows[0].skills || [] : [];
    const newTotal = currentSkills.length + skillIds.length;
    
    if (newTotal > 20) {
        throw new Error('Cannot add more skills. Maximum limit of 20 skills reached.');
    }

    const { rows } = await pool.query(
        `UPDATE recruiter_profile 
        SET skills = array_cat(COALESCE(skills, '{}'), $1::INTEGER[]),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillIds, userId]
    );
    return rows[0];
}

async function updateRecruiterSkills(userId, skillIds) {
    const { rows } = await pool.query(
        `UPDATE recruiter_profile 
        SET skills = $1::INTEGER[],
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillIds, userId]
    );
    return rows[0];
}

async function removeRecruiterSkill(userId, skillId) {
    const { rows } = await pool.query(
        `UPDATE recruiter_profile 
        SET skills = array_remove(skills, $1::INTEGER),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillId, userId]
    );
    return rows[0];
}

module.exports = {
    createRecruiterProfileTable,
    getRecruiterProfile,
    upsertRecruiterProfile,
    addRecruiterSkills,
    updateRecruiterSkills,
    removeRecruiterSkill,
    getRecruiterSkills
};