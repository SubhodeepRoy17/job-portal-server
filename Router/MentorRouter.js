// Router/MentorRouter.js
const express = require("express");
const MentorRouter = express.Router();

// Import controller methods
const {
    getMentors,
    getMentorProfile
} = require("../Controller/MentorController");

const { clientPlatform } = require("../Middleware/clientPlatform");
const { userAuthorizationHandler } = require("../Middleware/UserAuthorizationMiddleware");

// Get all mentors (role=3)
MentorRouter.get("/",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4), // All roles can access
    getMentors
);

// Get single mentor profile
MentorRouter.get("/:id",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4), // All roles can access
    getMentorProfile
);

module.exports = MentorRouter;