const { pool } = require("../Utils/DBconnect");

async function createUserProfileTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            user_type INTEGER NOT NULL CHECK (user_type BETWEEN 1 AND 4),
            course_name VARCHAR(100),
            specialization VARCHAR(100),
            start_year INTEGER,
            end_year INTEGER,
            designation VARCHAR(100),
            work_experience NUMERIC(3,1),
            currently_working BOOLEAN DEFAULT FALSE,
            purposes INTEGER[],
            skills INTEGER[] DEFAULT '{}',
            college_org_name VARCHAR(100) NOT NULL,
            about TEXT,
            full_address TEXT,
            social_links JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

async function getUserProfile(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM user_profiles WHERE user_id = $1",
        [userId]
    );
    return rows[0];
}

async function createUserProfile(profileData) {
    const purposes = Array.isArray(profileData.purposes) ? 
        profileData.purposes : 
        (profileData.purposes || '').toString().split(',').map(p => parseInt(p.trim())).filter(p => p);
    
    const { rows } = await pool.query(
        `INSERT INTO user_profiles (
            user_id, user_type, course_name, specialization,
            start_year, end_year,
            designation, work_experience, currently_working,
            purposes, college_org_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
            profileData.user_id,
            profileData.user_type,
            profileData.course_name,
            profileData.specialization,
            profileData.start_year,
            profileData.end_year,
            profileData.designation,
            profileData.work_experience,
            profileData.currently_working,
            purposes,
            profileData.college_org_name
        ]
    );
    return rows[0];
}

async function updateUserProfile(userId, profileData) {
    const purposes = Array.isArray(profileData.purposes) ? 
        profileData.purposes : 
        (profileData.purposes || '').toString().split(',').map(p => parseInt(p.trim())).filter(p => p);
    
    const { rows } = await pool.query(
        `UPDATE user_profiles SET
            user_type = $1,
            course_name = $2,
            specialization = $3,
            start_year = $4,
            end_year = $5,
            designation = $6,
            work_experience = $7,
            currently_working = $8,
            purposes = $9,
            college_org_name = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $11
        RETURNING *`,
        [
            profileData.user_type,
            profileData.course_name,
            profileData.specialization,
            profileData.start_year,
            profileData.end_year,
            profileData.designation,
            profileData.work_experience,
            profileData.currently_working,
            purposes,
            profileData.college_org_name,
            userId
        ]
    );
    return rows[0];
}

async function updateAbout(userId, aboutData) {
    const { rows } = await pool.query(
        `UPDATE user_profiles SET
            about = $1,
            full_address = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING *`,
        [aboutData.about, aboutData.full_address, userId]
    );
    return rows[0];
}

async function updateSocialLinks(userId, socialLinks) {
    // Validate and filter only HTTPS URLs
    const validatedLinks = {};
    if (socialLinks) {
        for (const [key, value] of Object.entries(socialLinks)) {
            if (value && typeof value === 'string' && value.startsWith('https://')) {
                validatedLinks[key] = value;
            }
        }
    }

    const { rows } = await pool.query(
        `UPDATE user_profiles SET
            social_links = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [Object.keys(validatedLinks).length > 0 ? validatedLinks : null, userId]
    );
    return rows[0];
}

async function getSkills(userId) {
    const { rows } = await pool.query(
        `SELECT skills FROM user_profiles WHERE user_id = $1`,
        [userId]
    );
    return rows[0] ? rows[0].skills : [];
}

async function addSkills(userId, skillIds) {
    const currentSkills = await getSkills(userId);
    const newTotal = currentSkills.length + skillIds.length;
    
    if (newTotal > 20) {
        throw new Error('Cannot add more skills. Maximum limit of 20 skills reached.');
    }

    const { rows } = await pool.query(
        `UPDATE user_profiles 
        SET skills = array_cat(COALESCE(skills, '{}'), $1::INTEGER[]),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillIds, userId]
    );
    return rows[0];
}

async function updateSkills(userId, skillIds) {
    const { rows } = await pool.query(
        `UPDATE user_profiles 
        SET skills = $1::INTEGER[],
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillIds, userId]
    );
    return rows[0];
}

async function removeSkill(userId, skillId) {
    const { rows } = await pool.query(
        `UPDATE user_profiles 
        SET skills = array_remove(skills, $1::INTEGER),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *`,
        [skillId, userId]
    );
    return rows[0];
}

module.exports = {
    createUserProfileTable,
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    updateAbout,
    updateSocialLinks,
    getSkills,
    addSkills,
    updateSkills,
    removeSkill
};