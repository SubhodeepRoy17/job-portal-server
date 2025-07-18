const { check } = require("express-validator");
const { JOB_TYPE, JOB_STATUS, VISIBILITY_STATUS } = require("../Utils/JobConstants");

exports.checkJobInput = [
    check("company").trim().notEmpty().withMessage("Job must have a Company"),
    check("position").trim().notEmpty().withMessage("Job must have a Position"),
    check("job_location").trim().notEmpty().withMessage("Job location is required"),
    check("job_status").isIn(Object.values(JOB_STATUS)).withMessage("Invalid job status"),
    check("job_type").isIn(Object.values(JOB_TYPE)).withMessage("Invalid job type"),
    check("job_vacancy").trim().notEmpty().withMessage("Job Vacancy is required"),
    check("job_salary").trim().notEmpty().withMessage("Job Salary is required"),
    check("job_deadline").trim().notEmpty().withMessage("Job Deadline is required"),
    check("job_description").trim().notEmpty().withMessage("Job Description is required"),
    check("job_skills").isArray({ min: 1 }).withMessage("Job Skills are required"),
    check("job_facilities").isArray({ min: 1 }).withMessage("Job Facilities are required"),
    check("job_contact").trim().notEmpty().withMessage("Job contact is required"),
];

exports.checkJobStatusUpdate = [
    check("visibility_status").isInt({ min: 1, max: 4 }).withMessage("Invalid visibility status"),
    check("admin_comment").optional().isString().withMessage("Comment must be a string"),
];