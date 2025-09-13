//Controller/MentorController.js
const { pool } = require("../Utils/DBconnect");
const createError = require("http-errors");

// GET mentors with role=3 (candidates) excluding current user
const getMentors = async (req, res, next) => {
    try {
        console.log('=== getMentors API called ===');
        console.log('Query params:', req.query);
        console.log('User info:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
        
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        // Exclude current user if exclude_current parameter is true
        const excludeCurrent = req.query.exclude_current === 'true';
        console.log('Exclude current user:', excludeCurrent);
        
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
        
        if (excludeCurrent && req.user && req.user.id) {
            query += ' AND id != $1';
            queryParams.push(req.user.id);
            console.log('Excluding user ID:', req.user.id);
        }
        
        query += `
            ORDER BY created_at DESC
            LIMIT $${queryParams.length + 1}
            OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(parseInt(limit), offset);
        
        console.log('Executing query:', query);
        console.log('Query params:', queryParams);
        
        // Execute the main query
        const result = await pool.query(query, queryParams);
        const mentors = result.rows;
        
        console.log('Found mentors:', mentors.length);
        
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
        
        if (excludeCurrent && req.user && req.user.id) {
            countQuery += ' AND id != $1';
            countParams.push(req.user.id);
        }
        
        console.log('Executing count query:', countQuery);
        console.log('Count params:', countParams);
        
        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);
        const hasMore = (page * limit) < totalCount;
        
        console.log('Total count:', totalCount);
        console.log('Has more:', hasMore);
        
        const response = {
            status: true,
            mentors: mentorsWithRatings,
            hasMore,
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        console.log('Sending response:', JSON.stringify(response, null, 2));
        
        // Ensure we're sending JSON response
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(response);
        
    } catch (error) {
        console.error('=== Error in getMentors ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', error);
        
        // Send a proper JSON error response
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
            status: false,
            message: 'Failed to fetch mentors',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    getMentors
};