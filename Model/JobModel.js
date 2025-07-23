const { pool } = require("../Utils/DBconnect");

async function createJobTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS jobs (
            id SERIAL PRIMARY KEY,
            company VARCHAR(100) NOT NULL 
                CHECK (LENGTH(TRIM(company)) >= 5 AND LENGTH(TRIM(company)) <= 100),
            position VARCHAR(200) NOT NULL 
                CHECK (LENGTH(TRIM(position)) >= 5 AND LENGTH(TRIM(position)) <= 200),
            job_status TEXT NOT NULL DEFAULT 'pending' 
                CHECK (job_status IN ('pending', 'interview', 'declined')),
            job_type TEXT NOT NULL DEFAULT 'full-time' 
                CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract')),
            job_location TEXT,
            workplace_type INTEGER NOT NULL
                CHECK (workplace_type BETWEEN 1 AND 4),
            categories INTEGER[] DEFAULT '{}',
            created_by INTEGER NOT NULL 
                REFERENCES users(id) ON DELETE CASCADE,
            job_vacancy TEXT NOT NULL 
                CHECK (LENGTH(TRIM(job_vacancy)) > 0),
            job_salary TEXT NOT NULL 
                CHECK (LENGTH(TRIM(job_salary)) > 0),
            job_deadline DATE NOT NULL 
                CHECK (job_deadline >= CURRENT_DATE),
            job_description TEXT NOT NULL 
                CHECK (LENGTH(TRIM(job_description)) >= 10),
            job_skills INTEGER[] NOT NULL 
                CHECK (array_length(job_skills, 1) > 0),
            job_facilities INTEGER[] DEFAULT '{}',
            job_contact TEXT NOT NULL 
                CHECK (LENGTH(TRIM(job_contact)) > 0 AND job_contact ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
            visibility_status INTEGER NOT NULL DEFAULT 1 
                CHECK (visibility_status BETWEEN 1 AND 4),
            admin_comment TEXT,
            eligibility INTEGER NOT NULL DEFAULT 1
                CHECK (eligibility BETWEEN 1 AND 3),
            student_currently_studying BOOLEAN,
            year_selection year_enum[],
            experience_min NUMERIC,
            experience_max NUMERIC,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
}

module.exports = {
    createJobTable
};