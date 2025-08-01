const { pool } = require("../Utils/DBconnect");

async function createProjectTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS user_projects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            skills INTEGER[],
            project_url VARCHAR(255),
            start_date DATE NOT NULL,
            end_date DATE,
            is_ongoing BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

async function addProject(userId, projectData) {
    const { title, description, skills, project_url, start_date, end_date, is_ongoing } = projectData;
    const query = `
        INSERT INTO user_projects 
        (user_id, title, description, skills, project_url, start_date, end_date, is_ongoing)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`;
    const values = [
        userId, 
        title, 
        description, 
        skills ? skills.map(skill => parseInt(skill)) : null, // Ensure skills are integers
        project_url, 
        start_date, 
        is_ongoing ? null : end_date, 
        is_ongoing
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
}

async function getProjectsByUser(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM user_projects WHERE user_id = $1 ORDER BY start_date DESC",
        [userId]
    );
    return rows;
}

async function updateProject(id, userId, projectData) {
    const { title, description, skills, project_url, start_date, end_date, is_ongoing } = projectData;
    const query = `
        UPDATE user_projects SET
        title = $1,
        description = $2,
        skills = $3,
        project_url = $4,
        start_date = $5,
        end_date = $6,
        is_ongoing = $7,
        updated_at = NOW()
        WHERE id = $8 AND user_id = $9
        RETURNING *`;
    const values = [
        title, 
        description, 
        skills ? skills.map(skill => parseInt(skill)) : null, // Ensure skills are integers
        project_url, 
        start_date, 
        is_ongoing ? null : end_date, 
        is_ongoing, 
        id, 
        userId
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
}

async function deleteProject(id, userId) {
    const { rowCount } = await pool.query(
        "DELETE FROM user_projects WHERE id = $1 AND user_id = $2",
        [id, userId]
    );
    return rowCount > 0;
}

module.exports = {
    createProjectTable,
    addProject,
    getProjectsByUser,
    updateProject,
    deleteProject
};