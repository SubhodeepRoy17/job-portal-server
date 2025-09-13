const express = require("express");
const MentorRouter = express.Router();

// Import controller methods
const {
    getMentors
} = require("../Controller/MentorController");

const { clientPlatform } = require("../Middleware/clientPlatform");
const { userAuthorizationHandler } = require("../Middleware/UserAuthorizationMiddleware");

// Get all mentors (role=3)
MentorRouter.get("/",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4), // All roles can access
    getMentors
);

module.exports = MentorRouter;