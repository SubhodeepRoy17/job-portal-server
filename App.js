const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const app = express();

const corsOptions = {
    origin: [
        "https://job-portal-client-ashen.vercel.app",
        "https://researchengine.in",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "X-Client-Platform", "Authorization"],
};

// Middleware Setup
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Static files and body parsing
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/img/logo', express.static(path.join(__dirname, 'public/img/logo')));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// Custom Middleware
const { authenticateUser } = require("./Middleware/UserAuthenticationMiddleware");
const { clientPlatform } = require("./Middleware/clientPlatform");
app.use(clientPlatform);

// Routers
const JobRouter = require("./Router/JobRouter");
const UserRouter = require("./Router/UserRouter");
const AuthRouter = require("./Router/AuthRouter");
const AdminRouter = require("./Router/AdminRouter");
const ApplicationRouter = require("./Router/ApplicationRouter");
const EducationRouter = require("./Router/EducationRouter");
const WorkExperienceRouter = require("./Router/WorkExperienceRouter");
const recruiterProfileRouter = require('./Router/RecruiterProfileRouter');
const UserProfileRouter = require("./Router/UserProfileRouter");
const SkillRouter = require("./Router/SkillRouter");
const CategoryRouter = require("./Router/CategoryRouter");
const FacilitiesRouter = require("./Router/FacilitiesRouter");
const CertificateRouter = require("./Router/CertificateRouter");
const ProjectRouter = require("./Router/ProjectRouter");
const companyProfileRouter = require('./Router/companyProfileRouter');

// Route Mounting
app.use("/api/skills", authenticateUser, SkillRouter);
app.use("/api/categories", authenticateUser, CategoryRouter);
app.use("/api/facilities", authenticateUser, FacilitiesRouter);
app.use("/api/jobs", authenticateUser, JobRouter);
app.use("/api/users", UserRouter);
app.use("/api/certificates", authenticateUser, CertificateRouter);
app.use("/api/projects", authenticateUser, ProjectRouter);
app.use("/api/auth", AuthRouter);
app.use('/api/user-profile', authenticateUser, UserProfileRouter);
app.use("/api/admin", authenticateUser, AdminRouter);
app.use("/api/recruiter-profile", authenticateUser, recruiterProfileRouter);
app.use("/api/application", authenticateUser, ApplicationRouter);
app.use("/api/work-experience", authenticateUser, WorkExperienceRouter);
app.use("/api/education", authenticateUser, EducationRouter);
app.use("/api/company", companyProfileRouter);

module.exports = app;