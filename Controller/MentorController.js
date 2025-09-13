// Controller/MentorController.js
const { pool } = require("../Utils/DBconnect");
const createError = require("http-errors");

// GET mentors with role=3 (candidates) excluding current user
const getMentors = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        // Exclude current user if exclude_current parameter is true
        const excludeCurrent = req.query.exclude_current === 'true';
        
        let query = `
            SELECT 
                id, 
                full_name, 
                profile_photo, 
                heading as headline,
                role as type
            FROM users 
            WHERE role = 3 
            AND ac_status = 1
        `;
        
        let queryParams = [];
        
        if (excludeCurrent && req.user) {
            query += ' AND id != $1';
            queryParams.push(req.user.id);
        }
        
        query += `
            ORDER BY created_at DESC
            LIMIT $${queryParams.length + 1}
            OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(parseInt(limit), offset);
        
        const { rows: mentors } = await pool.query(query, queryParams);
        
        // Add mock ratings since they don't exist in DB
        const mentorsWithRatings = mentors.map(mentor => ({
            ...mentor,
            rating: generateMockRating() // Generate random rating between 4.5-5.0
        }));
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) FROM users 
            WHERE role = 3 
            AND ac_status = 1
        `;
        
        let countParams = [];
        
        if (excludeCurrent && req.user) {
            countQuery += ' AND id != $1';
            countParams.push(req.user.id);
        }
        
        const { rows: countResult } = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult[0].count);
        const hasMore = (page * limit) < totalCount;
        
        res.status(200).json({
            status: true,
            mentors: mentorsWithRatings,
            hasMore,
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching mentors:', error);
        next(createError(500, error.message));
    }
};

// GET single mentor profile with all details
const getMentorProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get user basic info
        const userQuery = await pool.query(
            `SELECT 
                id, 
                full_name, 
                profile_photo, 
                heading as headline,
                location,
                role as type
            FROM users WHERE id = $1 AND role = 3 AND ac_status = 1`,
            [id]
        );
        
        if (userQuery.rows.length === 0) {
            return next(createError(404, "Mentor not found"));
        }
        
        const mentorData = userQuery.rows[0];
        
        // Get all related data in parallel
        const [
            profileQuery,
            workExperienceQuery,
            educationQuery,
            certificatesQuery,
            projectsQuery
        ] = await Promise.all([
            pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [id]),
            pool.query("SELECT * FROM work_experience WHERE user_id = $1 ORDER BY start_year DESC, start_month DESC", [id]),
            pool.query("SELECT * FROM education WHERE user_id = $1 ORDER BY start_year DESC", [id]),
            pool.query("SELECT * FROM user_certificates WHERE user_id = $1 ORDER BY issue_date DESC", [id]),
            pool.query("SELECT * FROM user_projects WHERE user_id = $1 ORDER BY start_date DESC", [id])
        ]);
        
        // Add mock rating
        const mentorWithRating = {
            ...mentorData,
            rating: generateMockRating()
        };
        
        // Build the response object
        const response = {
            status: true,
            mentor: {
                ...mentorWithRating,
                profile: profileQuery.rows[0] || null,
                work_experiences: workExperienceQuery.rows,
                educations: educationQuery.rows,
                certificates: certificatesQuery.rows,
                projects: projectsQuery.rows
            }
        };
        
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching mentor profile:', error);
        next(createError(500, error.message));
    }
};

// Helper function to generate mock ratings (4.5 - 5.0)
const generateMockRating = () => {
    return (Math.random() * 0.5 + 4.5).toFixed(1);
};

module.exports = {
    getMentors,
    getMentorProfile
};