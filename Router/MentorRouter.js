//Router/MentorRouter.js
const express = require("express");
const MentorRouter = express.Router();

// Import controller methods
const {
    getMentors
} = require("../Controller/MentorController");

const { clientPlatform } = require("../Middleware/clientPlatform");
const { optionalAuthenticateUser } = require("../Middleware/OptionalAuthenticationMiddleware");

// Get all mentors (role=3) - allows both authenticated and unauthenticated access
MentorRouter.get("/",
    clientPlatform,
    optionalAuthenticateUser, // This will set req.user if token exists, otherwise continues
    getMentors
);

module.exports = MentorRouter;