const { pool } = require("../Utils/DBconnect");

async function createWorkExperienceTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS work_experience (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            company_name VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            employment_type INTEGER NOT NULL CHECK (employment_type BETWEEN 1 AND 4),
            location VARCHAR(100) NOT NULL,
            start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
            start_year INTEGER NOT NULL,
            end_month INTEGER CHECK (end_month BETWEEN 1 AND 12),
            end_year INTEGER,
            currently_working BOOLEAN DEFAULT FALSE,
            skills TEXT [],
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

async function getWorkExperiences(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM work_experience WHERE user_id = $1 ORDER BY start_year DESC, start_month DESC",
        [userId]
    );
    return rows;
}

async function createWorkExperience(experienceData) {
  let skills = experienceData.skills || [];
  if (typeof skills === 'string') {
    skills = skills.split(',').map(s => s.trim()).filter(s => s);
  } else if (!Array.isArray(skills)) {
    skills = [];
  }

  const { rows } = await pool.query(
    `INSERT INTO work_experience (
      user_id, company_name, designation, employment_type, location,
      start_month, start_year, end_month, end_year, currently_working, 
      skills, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      experienceData.user_id,
      experienceData.company_name,
      experienceData.designation,
      experienceData.employment_type,
      experienceData.location,
      experienceData.start_month,
      experienceData.start_year,
      experienceData.end_month,
      experienceData.end_year,
      experienceData.currently_working,
      skills,
      experienceData.description
    ]
  );
  return rows[0];
}

async function updateWorkExperience(id, experienceData) {
    const { rows } = await pool.query(
        `UPDATE work_experience SET
            company_name = $1,
            designation = $2,
            employment_type = $3,
            location = $4,
            start_month = $5,
            start_year = $6,
            end_month = $7,
            end_year = $8,
            currently_working = $9,
            skills = $10,
            description = $11,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *`,
        [
            experienceData.company_name,
            experienceData.designation,
            experienceData.employment_type,
            experienceData.location,
            experienceData.start_month,
            experienceData.start_year,
            experienceData.end_month,
            experienceData.end_year,
            experienceData.currently_working,
            experienceData.skills || [],
            experienceData.description,
            id
        ]
    );
    return rows[0];
}

async function deleteWorkExperience(id) {
    await pool.query("DELETE FROM work_experience WHERE id = $1", [id]);
}

module.exports = {
    createWorkExperienceTable,
    getWorkExperiences,
    createWorkExperience,
    updateWorkExperience,
    deleteWorkExperience
};