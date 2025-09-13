const { pool } = require("../Utils/DBconnect");
const createError = require("http-errors");

// GET mentors with role=3 (candidates) excluding current user
const getMentors = async (req, res, next) => {
    try {
        console.log('Fetching mentors with role=3');
        
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
        
        console.log('Executing query:', query, 'with params:', queryParams);
        
        const { rows: mentors } = await pool.query(query, queryParams);
        
        // Add mock ratings since they don't exist in DB
        const mentorsWithRatings = mentors.map(mentor => ({
            ...mentor,
            rating: (Math.random() * 0.5 + 4.5).toFixed(1) // Generate random rating between 4.5-5.0
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

module.exports = {
    getMentors
};