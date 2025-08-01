const { pool } = require("../Utils/DBconnect");
const createError = require("http-errors");
const { VISIBILITY_STATUS } = require("../Utils/JobConstants");

// Helper function to build search query
const buildSearchQuery = (filters, searchQuery) => {
    if (searchQuery) {
        filters.$or = [
            { company: { $regex: new RegExp(".*" + searchQuery + ".*", "i") } },
            { position: { $regex: new RegExp(".*" + searchQuery + ".*", "i") } },
            { job_status: { $regex: new RegExp(".*" + searchQuery + ".*", "i") } },
            { job_type: { $regex: new RegExp(".*" + searchQuery + ".*", "i") } },
            { job_location: { $regex: new RegExp(".*" + searchQuery + ".*", "i") } },
        ];
    }
    return filters;
};

// Get all jobs with filters, sorting, and pagination
module.exports.getAllJobs = async (req, res, next) => {
    try {
        let baseQuery = "SELECT * FROM jobs WHERE 1=1";
        let countQuery = "SELECT COUNT(*) FROM jobs WHERE 1=1";
        const params = [];
        const countParams = [];
        let paramIndex = 1;

        // Add visibility filter based on user role
        if (req.user.role === 3) { // Regular user
            baseQuery += ` AND visibility_status = $${paramIndex}`;
            countQuery += ` AND visibility_status = $${paramIndex}`;
            params.push(VISIBILITY_STATUS.ACCEPTED);
            countParams.push(VISIBILITY_STATUS.ACCEPTED);
            paramIndex++;
        } else if (req.user.role === 2) { // Recruiter
            baseQuery += ` AND (visibility_status = $${paramIndex} OR created_by = $${paramIndex + 1})`;
            countQuery += ` AND (visibility_status = $${paramIndex} OR created_by = $${paramIndex + 1})`;
            params.push(VISIBILITY_STATUS.ACCEPTED, req.user.id);
            countParams.push(VISIBILITY_STATUS.ACCEPTED, req.user.id);
            paramIndex += 2;
        }
        // Admin can see all jobs without additional filters

        // Search
        if (req.query.search) {
            const search = `%${req.query.search}%`;
            const condition = ` AND (company ILIKE $${paramIndex} OR position ILIKE $${paramIndex} OR job_status ILIKE $${paramIndex} OR job_type ILIKE $${paramIndex} OR job_location ILIKE $${paramIndex})`;
            baseQuery += condition;
            countQuery += condition;
            params.push(search);
            countParams.push(search);
            paramIndex++;
        }

        // Sorting
        if (req.query.sort) {
            const sortMap = {
                "newest": "created_at DESC",
                "oldest": "created_at ASC",
                "a-z": "position ASC",
                "z-a": "position DESC",
            };
            const sortSQL = sortMap[req.query.sort] || "created_at DESC";
            baseQuery += ` ORDER BY ${sortSQL}`;
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;
        baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Execute queries
        const jobsResult = await pool.query(baseQuery, params);
        const countResult = await pool.query(countQuery, countParams);
        const totalJobs = parseInt(countResult.rows[0].count, 10);
        const pageCount = Math.ceil(totalJobs / limit);

        if (jobsResult.rows.length === 0) {
            return next(createError(404, "No jobs found"));
        }

        res.status(200).json({
            status: true,
            result: jobsResult.rows,
            totalJobs,
            currentPage: page,
            pageCount,
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports.getJobsForReview = async (req, res, next) => {
    try {
        const query = `
            SELECT j.*, u.username, u.email 
            FROM jobs j
            JOIN users u ON j.created_by = u.id
            ORDER BY j.created_at DESC`;
        
        const result = await pool.query(query);

        res.status(200).json({
            status: true,
            result: result.rows
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports.updateJobStatus = async (req, res, next) => {
    const { id } = req.params;
    const { visibility_status, admin_comment } = req.body;
    
    try {
        // Check if job exists
        const checkQuery = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
        if (checkQuery.rowCount === 0) {
            return next(createError(404, "Job not found"));
        }

        // Update job status and comment
        const query = `
            UPDATE jobs 
            SET visibility_status = $1, 
                admin_comment = $2, 
                updated_at = NOW()
            WHERE id = $3
            RETURNING *`;

        const result = await pool.query(query, [visibility_status, admin_comment, id]);

        res.status(200).json({
            status: true,
            message: "Job status updated successfully",
            result: result.rows[0]
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Get jobs posted by the current recruiter
module.exports.getMyJobs = async (req, res, next) => {
    try {
        const query = `
            SELECT j.*, u.username, u.email 
            FROM jobs j
            JOIN users u ON j.created_by = u.id
            WHERE j.created_by = $1
            ORDER BY j.created_at DESC`;
        
        const result = await pool.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No jobs found for this user"
            });
        }

        res.status(200).json({
            status: true,
            result: result.rows
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Get single job by ID
module.exports.getSingleJob = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = "SELECT * FROM jobs WHERE id = $1";
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return next(createError(404, "Job not found"));
        }

        res.status(200).json({
            status: true,
            result: result.rows[0]
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Add a new job
module.exports.addJob = async (req, res, next) => {
    const jobData = req.body;
    const currentcategories = jobData.categories || [];
    const newTotalCategories = currentcategories.map(cat => parseInt(cat, 10));

    if (newTotalCategories.length > 10) {
        return next(createError(400, "You can only add up to 10 categories"));
    }

    if (!jobData.job_facilities || jobData.job_facilities.length === 0) {
        return next(createError(400, "At least one facility must be selected"));
    }

    try {
        // Check if job already exists
        const existsQuery = await pool.query(
            "SELECT id FROM jobs WHERE company = $1 AND position = $2",
            [jobData.company, jobData.position]
        );

        if (existsQuery.rowCount > 0) {
            return next(createError(409, "Job already exists"));
        }

        if (jobData.eligibility === 2 && (!jobData.year_selection || jobData.year_selection.length === 0)) {
            return next(createError(400, "Year selection is required for freshers"));
        }

        if (jobData.eligibility === 3) {
            if (!jobData.experience_min || !jobData.experience_max) {
                return next(createError(400, "Experience range is required for experienced candidates"));
            }
            if (parseFloat(jobData.experience_max) < parseFloat(jobData.experience_min)) {
                return next(createError(400, "Maximum experience must be greater than or equal to minimum experience"));
            }
        }

        const query = `
            INSERT INTO jobs (
                company, position, job_status, job_type, job_location,
                workplace_type, categories, created_by, job_vacancy, job_salary, job_deadline,
                job_description, job_skills, job_facilities, job_contact,
                visibility_status, eligibility, student_currently_studying,
                year_selection, experience_min, experience_max
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`;

        const values = [
            jobData.company,
            jobData.position,
            jobData.job_status,
            jobData.job_type,
            jobData.workplace_type === 1 ? null : jobData.job_location,
            jobData.workplace_type,
            jobData.categories,
            req.user.id,
            jobData.job_vacancy,
            jobData.job_salary,
            jobData.job_deadline,
            jobData.job_description,
            jobData.job_skills,
            jobData.job_facilities,
            jobData.job_contact,
            VISIBILITY_STATUS.UNDER_REVIEW,
            jobData.eligibility || 1,
            jobData.eligibility === 1 ? jobData.student_currently_studying : 
                (jobData.student_currently_studying || null),
            jobData.eligibility === 2 ? jobData.year_selection : null,
            jobData.eligibility === 3 ? jobData.experience_min : null,
            jobData.eligibility === 3 ? jobData.experience_max : null
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            status: true,
            result: result.rows[0]
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};


// Update a job
module.exports.updateSingleJob = async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const currentcategories = data.categories || [];
    const newTotalCategories = currentcategories.map(cat => parseInt(cat, 10));
    if (newTotalCategories.length > 10) {
        return next(createError(400, "You can only update up to 10 categories"));
    }
    if (!data.job_facilities || data.job_facilities.length === 0) {
        return next(createError(400, "At least one facility must be selected"));
    }
    try {
        // Check if job exists
        const checkQuery = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
        if (checkQuery.rowCount === 0) {
            return next(createError(404, "Job not found"));
        }

        // Verify the user is the creator or admin
        if (checkQuery.rows[0].created_by !== req.user.id && req.user.role !== 1) {
            return next(createError(403, "Not authorized to update this job"));
        }

        if (data.eligibility === 2 && (!data.year_selection || data.year_selection.length === 0)) {
            return next(createError(400, "Year selection is required for freshers"));
        }

        if (data.eligibility === 3) {
            if (!data.experience_min || !data.experience_max) {
                return next(createError(400, "Experience range is required for experienced candidates"));
            }
            if (parseFloat(data.experience_max) < parseFloat(data.experience_min)) {
                return next(createError(400, "Maximum experience must be greater than or equal to minimum experience"));
            }
        }

        const query = `
            UPDATE jobs 
            SET company = $1, position = $2, job_status = $3, job_type = $4, 
                job_location = $5, workplace_type = $6, categories = $7, job_vacancy = $8, 
                job_salary = $9, job_deadline = $10, job_description = $11, 
                job_skills = $12, job_facilities = $13, job_contact = $14,
                eligibility = $15, student_currently_studying = $16,
                year_selection = $17, experience_min = $18, experience_max = $19,
                updated_at = NOW()
            WHERE id = $20
            RETURNING *`;

        const values = [
            data.company,
            data.position,
            data.job_status,
            data.job_type,
            data.workplace_type === 1 ? null : data.job_location,
            data.workplace_type,
            data.categories,
            data.job_vacancy,
            data.job_salary,
            data.job_deadline,
            data.job_description,
            data.job_skills,
            data.job_facilities,
            data.job_contact,
            data.eligibility || checkQuery.rows[0].eligibility || 1,
            data.eligibility === 1 ? data.student_currently_studying : 
                (data.student_currently_studying !== undefined ? data.student_currently_studying : checkQuery.rows[0].student_currently_studying),
            data.eligibility === 2 ? data.year_selection : 
                (data.eligibility !== 2 ? null : checkQuery.rows[0].year_selection),
            data.eligibility === 3 ? data.experience_min : 
                (data.eligibility !== 3 ? null : checkQuery.rows[0].experience_min),
            data.eligibility === 3 ? data.experience_max : 
                (data.eligibility !== 3 ? null : checkQuery.rows[0].experience_max),
            id
        ];

        const result = await pool.query(query, values);

        res.status(200).json({
            status: true,
            message: "Job updated successfully",
            result: result.rows[0]
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Delete a single job
module.exports.deleteSingleJob = async (req, res, next) => {
    const { id } = req.params;
    try {
        // Check if job exists
        const checkQuery = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
        if (checkQuery.rowCount === 0) {
            return next(createError(404, "Job not found"));
        }

        // Verify the user is the creator or admin
        if (checkQuery.rows[0].created_by !== req.user.id && req.user.role !== 1) {
            return next(createError(403, "Not authorized to delete this job"));
        }

        // Delete associated applications first
        await pool.query("DELETE FROM applications WHERE job_id = $1", [id]);

        // Then delete the job
        await pool.query("DELETE FROM jobs WHERE id = $1", [id]);

        res.status(200).json({
            status: true,
            message: "Job and associated applications deleted successfully"
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Delete all jobs (admin only)
module.exports.deleteAllJobs = async (req, res, next) => {
    try {
        // First delete all applications
        await pool.query("DELETE FROM applications");

        // Then delete all jobs
        const result = await pool.query("DELETE FROM jobs RETURNING *");

        res.status(200).json({
            status: true,
            message: "All jobs and applications deleted successfully",
            count: result.rowCount
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};