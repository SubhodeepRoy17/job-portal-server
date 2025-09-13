//Controller/UserController.js
const { pool } = require("../Utils/DBconnect");
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const JWTGenerator = require("../Utils/JWTGenerator");
const { findOrCreateGoogleUser, findOrCreateGoogleRecruiter } = require("../Model/UserModel");
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// GET all users (excluding password)
const getAllUser = async (req, res, next) => {
    try {
        const { rows } = await pool.query("SELECT id, username, email, location, gender, role, resume FROM users");
        if (rows.length) {
            res.status(200).json({ status: true, result: rows });
        } else {
            next(createError(200, "User list is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

// GET single user by ID
const getSingleUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

        if (rows.length === 0) {
            return next(createError(404, "User not found"));
        }

        res.status(200).json({ status: true, result: rows[0] });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// GET current user info with all related data
const getMe = async (req, res, next) => {
    try {
        if (!req.user) return next(createError(401, "Please login first"));
        
        // Get user basic info
        const userQuery = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [req.user.id]
        );
        
        if (userQuery.rows.length === 0) {
            return next(createError(404, "User not found"));
        }
        
        const userData = userQuery.rows[0];
        
        // Get all related data in parallel
        const [
            profileQuery,
            workExperienceQuery,
            educationQuery,
            certificatesQuery,
            projectsQuery
        ] = await Promise.all([
            pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [req.user.id]),
            pool.query("SELECT * FROM work_experience WHERE user_id = $1 ORDER BY start_year DESC, start_month DESC", [req.user.id]),
            pool.query("SELECT * FROM education WHERE user_id = $1 ORDER BY start_year DESC", [req.user.id]),
            pool.query("SELECT * FROM user_certificates WHERE user_id = $1 ORDER BY issue_date DESC", [req.user.id]),
            pool.query("SELECT * FROM user_projects WHERE user_id = $1 ORDER BY start_date DESC", [req.user.id])
        ]);
        
        // Build the response object
        const response = {
            status: true,
            platform: req.clientPlatform,
            result: {
                ...userData,
                profile: profileQuery.rows[0] || null,
                work_experiences: workExperienceQuery.rows,
                educations: educationQuery.rows,
                certificates: certificatesQuery.rows,
                projects: projectsQuery.rows
            }
        };
        
        res.status(200).json(response);
    } catch (error) {
        next(createError(500, error.message));
    }
};

const googleAuth = async (req, res, next) => {
    try {
        let {
            email,
            google_uid,
            full_name = "Google User",
            profile_photo = null,
            signup_type = "g"
        } = req.body;

        if (!email || !google_uid) {
            return next(createError(400, "Email and Google UID are required"));
        }

        email = email.trim().toLowerCase();

        const googleUser = { email, full_name, profile_photo, google_uid };

        const user = await findOrCreateGoogleUser(googleUser);

        // ✅ Check account status AFTER user is retrieved
        if (user.ac_status === 2) {
            return next(createError(403, "Account is in hibernation. 🔗 Click here to activate account"));
        }
        if (user.ac_status === 3) {
            return next(createError(403, "Account is deleted. 🔗 Click here to activate account"));
        }

        const tokenObj = { ID: user.id, role: user.role };
        const token = JWTGenerator(tokenObj);
        const threeMonths = 1000 * 60 * 60 * 24 * 90;

        res.cookie(process.env.COOKIE_NAME, token, {
            expires: new Date(Date.now() + threeMonths),
            secure: true,
            httpOnly: true,
            signed: true,
            sameSite: "None",
        });

        console.log(`[GOOGLE_AUTH] Platform: ${req.clientPlatform} | Email: ${email} | UID: ${google_uid}`);

        res.status(200).json({
            status: true,
            message: "Google authentication successful",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                profile_photo: user.profile_photo,
                role: user.role,
                ac_status: user.ac_status
            },
        });
    } catch (error) {
        console.error("[GOOGLE_AUTH_ERROR]", error);
        next(createError(500, "Google authentication failed"));
    }
};

const googleAuthRecruiter = async (req, res, next) => {
    try {
        let {
            email,
            google_uid,
            full_name = "Google User",
            profile_photo = null,
            signup_type = "g"
        } = req.body;

        if (!email || !google_uid) {
            return next(createError(400, "Email and Google UID are required"));
        }

        email = email.trim().toLowerCase();

        const googleUser = { email, full_name, profile_photo, google_uid };

        const user = await findOrCreateGoogleRecruiter(googleUser);

        const tokenObj = { ID: user.id, role: user.role };
        const token = JWTGenerator(tokenObj);
        const threeMonths = 1000 * 60 * 60 * 24 * 90;

        res.cookie(process.env.COOKIE_NAME, token, {
            expires: new Date(Date.now() + threeMonths),
            secure: true,
            httpOnly: true,
            signed: true,
            sameSite: "None",
        });

        console.log(`[GOOGLE_AUTH_RECRUITER] Platform: ${req.clientPlatform} | Email: ${email} | UID: ${google_uid}`);

        res.status(200).json({
            status: true,
            message: "Google recruiter authentication successful",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                profile_photo: user.profile_photo,
                role: user.role,
                ac_status: user.ac_status
            },
        });
    } catch (error) {
        console.error("[GOOGLE_AUTH_RECRUITER_ERROR]", error);
        next(createError(500, "Google recruiter authentication failed"));
    }
};

const logOut = async (req, res, next) => {
    try {
        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        }).status(200).json({ status: true, message: "Logout done" });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Register user
const addUser = async (req, res, next) => {
    const data = req.body;
    try {
        const { rows: existing } = await pool.query("SELECT * FROM users WHERE email = $1", [data.email]);
        if (existing.length) return next(createError(409, "Email already exists"));

        const hashedPassword = await bcrypt.hash(data.password, 16);
        
        const { rowCount } = await pool.query("SELECT COUNT(*) FROM users");
        const role = rowCount === 0 ? 1 : 3; // Admin if first user, else regular user
        const ac_status = 1; // Default to active account status

        await pool.query(
            `INSERT INTO users (
                full_name, 
                email, 
                password, 
                role,  
                location, 
                gender, 
                resume, 
                signup_type,
                ac_status,
                heading,
                is_mail_verified,
                is_mo_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, FALSE)`,
            [
                data.full_name, 
                data.email, 
                hashedPassword, 
                role,  
                data.location, 
                data.gender, 
                data.resume || null, 
                data.signup_type || 'e',
                ac_status,
                data.heading || null
            ]
        );

        console.log(`[REGISTER] Platform: ${req.clientPlatform} | Email: ${data.email}`);

        res.status(200).json({ status: true, message: "Registered Successfully" });
    } catch (error) {
        next(createError(500, error.message));
    }
};


// Register recruiter
const addRecruiter = async (req, res, next) => {
    const data = req.body;
    try {
        const { rows: existing } = await pool.query("SELECT * FROM users WHERE email = $1", [data.email]);
        if (existing.length) return next(createError(409, "Email already exists"));

        const hashedPassword = await bcrypt.hash(data.password, 16);
        
        const role = 2; // Recruiter role
        const ac_status = 1; // Default to active account

        await pool.query(
            `INSERT INTO users (
                full_name, 
                email, 
                password, 
                role,  
                location, 
                gender, 
                resume, 
                signup_type,
                ac_status,
                heading,
                is_mail_verified,
                is_mo_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, FALSE)`,
            [
                data.full_name, 
                data.email, 
                hashedPassword, 
                role,  
                data.location, 
                data.gender, 
                data.resume || null, 
                data.signup_type || 'e',
                ac_status,
                data.heading || null
            ]
        );

        console.log(`[REGISTER] Platform: ${req.clientPlatform} | Email: ${data.email}`);

        res.status(200).json({ status: true, message: "Registered Successfully" });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Register company
const addCompany = async (req, res, next) => {
    const data = req.body;
    try {
        // Validate required fields
        if (!data.email || !data.password || !data.full_name || !data.mobile_no) {
            return next(createError(400, "Email, password, full name and mobile number are required"));
        }

        const disallowedDomains = ['gmail.com', 'outlook.com', 'icloud.com'];
        const emailDomain = data.email.split('@')[1]?.toLowerCase();
        if (disallowedDomains.includes(emailDomain)) {
            return next(createError(400, "Use company official mail id along with your website domain (e.g., info@tcs.com)"));
        }

        // Check if email already exists
        const { rows: existing } = await pool.query(
            "SELECT id FROM users WHERE email = $1", 
            [data.email.toLowerCase()]
        );
        if (existing.length) return next(createError(409, "Email already exists"));

        // Validate mobile number format
        const phoneNumber = parsePhoneNumberFromString(data.mobile_no);
        if (!phoneNumber || !phoneNumber.isValid()) {
            return next(createError(400, "Invalid phone number"));
        }
        const formattedMobileNo = phoneNumber.format('E.164');

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        // Company role is 4
        const role = 4; 
        const ac_status = 1; // Active account by default
        const signup_type = 'e'; // Email signup

        // Insert company into users table - REMOVE ALL COMMENTS FROM THE SQL QUERY
        const { rows: [newCompany] } = await pool.query(
            `INSERT INTO users (
                email, 
                password, 
                full_name,
                mobile_no,
                role,  
                signup_type,
                ac_status,
                is_mail_verified,
                is_mo_verified,
                location,
                gender,
                resume,
                heading
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, email, full_name, role, ac_status`,
            [
                data.email.toLowerCase(), 
                hashedPassword, 
                data.full_name,
                formattedMobileNo,
                role,  
                signup_type,
                ac_status,
                false,
                false,
                data.location || null,
                data.gender || null,
                data.resume || null,
                data.heading || null
            ]
        );

        console.log(`[COMPANY_REGISTER] Platform: ${req.clientPlatform} | Email: ${data.email}`);

        res.status(200).json({ 
            status: true, 
            message: "Company Registered Successfully",
            company: newCompany
        });
    } catch (error) {
        console.error("Company registration error:", error);
        next(createError(500, "Registration failed. Please check your input."));
    }
};

const updateMobileVerification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const mobile_no = req.body.mobile_no;
        
        await pool.query(
            "UPDATE users SET mobile_no = $1, is_mo_verified = $2 WHERE id = $3",
            [mobile_no, true, userId]
        );

        res.status(200).json({ 
            status: true, 
            message: "Mobile number verified successfully" 
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

const updateMobileEdit = async (req, res, next) => {
    try {
    const userId = req.user?.id;
    
    await pool.query(
      "UPDATE users SET is_mo_verified = false WHERE id = $1",
      [userId]
    );

    res.status(200).json({ 
      status: true, 
      message: "Mobile verification reset" 
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

const updateAcStatus = async (req, res, next) => {
    try {
        const { ac_status } = req.body;
        const userId = req.user?.id;

        if (req.user?.role !== 3) {
            return next(createError(403, "Only regular users can change account status"));
        }

        if (![1, 2, 3].includes(ac_status)) {
            return next(createError(400, "Invalid account status"));
        }

        await pool.query("UPDATE users SET ac_status = $1 WHERE id = $2", [ac_status, userId]);

        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        }).status(200).json({
            status: true,
            message: `Account ${
                ac_status === 2 ? "hibernated" : ac_status === 3 ? "deleted" : "activated"
            }, and logged out.`,
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};


const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = rows[0];
        if (!user) return next(createError(404, "User not found"));
        if (user.ac_status === 2) {
            return next(createError(403, "Account is in hibernation. 🔗 Click here to activate account"));
        }

        if (user.ac_status === 3) {
            return next(createError(403, "Account is deleted. 🔗 Click here to activate account"));
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return next(createError(401, "Email or password not matched"));

        const tokenObj = { ID: user.id, role: user.role };
        const token = JWTGenerator(tokenObj);
        const threeMonths = 1000 * 60 * 60 * 24 * 90; // 3 months in milliseconds

        res.cookie(process.env.COOKIE_NAME, token, {
            expires: new Date(Date.now() + threeMonths),
            secure: true,
            httpOnly: true,
            signed: true,
            sameSite: "None",
        });

        console.log(`[LOGIN] Platform: ${req.clientPlatform} | Email: ${email}`);

        // 5. Return token in JSON response
        res.status(200).json({ 
            status: true,
            message: "Login Successfully",
            token, // Bearer token for API requests
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Update user resume only
const updateResume = async (req, res, next) => {
    const { resume } = req.body;
    try {
        if (!resume.startsWith('https://')) {
            return next(createError(400, "Resume URL must start with https://"));
        }

        const { rows } = await pool.query(
            "UPDATE users SET resume = $1 WHERE id = $2 RETURNING id, resume",
            [resume, req.user.id]
        );

        if (rows.length === 0) {
            return next(createError(404, "User not found"));
        }

        res.status(200).json({ 
            status: true, 
            message: "Resume updated successfully",
            resume: rows[0].resume
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Update user
const updateUser = async (req, res, next) => {
    try {
        const data = req.body;
        if (req?.user?.email !== data?.email) return next(createError(403, "You have no permission to update"));

        let mobileNo = null;
        if (data.mobile_no) {
            const phoneNumber = parsePhoneNumberFromString(data.mobile_no);
            if (!phoneNumber || !phoneNumber.isValid()) {
                return next(createError(400, "Invalid phone number"));
            }
            mobileNo = phoneNumber.format('E.164');
        }
        
        const { rows: [currentUser] } = await pool.query(
            'SELECT username, email, mobile_no FROM users WHERE id = $1',
            [req.user.id]
        );

        if (data.username && data.username !== currentUser.username) {
            const { rows } = await pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2',
                [data.username, req.user.id]
            );
            if (rows.length > 0) {
                return next(createError(409, 'Username already taken'));
            }
        }

        if (data.mobile_no) {
            const { rows: mobileCheck } = await pool.query(
                "SELECT id FROM users WHERE mobile_no = $1 AND id != $2 AND mobile_no IS NOT NULL",
                [data.mobile_no, req.user.id]
            );
            if (mobileCheck.length > 0) {
                return next(createError(409, "Mobile number already registered"));
            }
        }

        // Only allow preference and dob updates for regular users (role=3)
        let updateFields = {
            full_name: data.full_name || null,
            username: data.username,
            location: data.location,
            gender: data.gender,
            heading: data.heading || null,
            updated_at: 'NOW()'
        };

        if (req.user.role === 3 || req.user.role === 2) {
            updateFields.dob = data.dob || null;     
            updateFields.mobile_no = mobileNo || null;
        }

        if (req.user.role === 3) {
            updateFields.preference = data.preference || null;
        }

        const setClause = Object.keys(updateFields)
            .map((key, i) => `${key}=$${i + 1}`)
            .join(', ');

        const values = Object.values(updateFields);

        await pool.query(
            `UPDATE users SET ${setClause} WHERE email=$${values.length + 1}`,
            [...values, data.email]
        );

        const { rows: updatedUser } = await pool.query(
            "SELECT id, full_name, username, email, location, gender, role, resume, dob, preference, heading, mobile_no FROM users WHERE email=$1", 
            [data.email]
        );

        res.status(200).json({ status: true, message: "Profile Updated", result: updatedUser[0] });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Delete a user
const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
        if (!rowCount) return next(createError(404, "User not found"));
        res.status(200).json({ status: true, message: "User Deleted" });
    } catch (error) {
        next(createError(500, error.message));
    }
};

// Delete all users
const deleteAllUser = async (req, res, next) => {
    try {
        await pool.query("DELETE FROM users");
        res.status(200).json({ status: true, message: "All users deleted" });
    } catch (error) {
        next(createError(500, error.message));
    }
};

const hibernateAccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        await pool.query("UPDATE users SET ac_status = 2 WHERE id = $1", [userId]);
        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        }).status(200).json({ status: true, message: "Account hibernated and logged out." });
    } catch (error) {
        next(createError(500, error.message));
    }
};

const deleteAccountPermanently = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        await pool.query("UPDATE users SET ac_status = 3 WHERE id = $1", [userId]);
        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        }).status(200).json({ status: true, message: "Account deleted and logged out." });
    } catch (error) {
        next(createError(500, error.message));
    }
};


module.exports = {
    getAllUser,
    getSingleUser,
    getMe,
    logOut,
    addUser,
    addRecruiter,
    addCompany,
    updateResume,
    loginUser,
    updateMobileVerification,
    updateMobileEdit,
    updateUser,
    deleteUser,
    deleteAllUser,
    googleAuth,
    googleAuthRecruiter,
    updateAcStatus,
    hibernateAccount,
    deleteAccountPermanently
};