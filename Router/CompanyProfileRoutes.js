const express = require("express");
const router = express.Router();
const CompanyProfileController = require("../Controller/CompanyProfileController1");
const { checkCompanyProfileInput } = require("../Validation/CompanyProfileValidation");
const { userAuthorizationHandler } = require("../Middleware/UserAuthorizationMiddleware");
const { clientPlatform } = require("../Middleware/clientPlatform");

router.use(clientPlatform, userAuthorizationHandler(4)); // Only for company users (role 4)

router.get("/", CompanyProfileController.getCompanyProfile);
router.post("/", checkCompanyProfileInput, CompanyProfileController.createCompanyProfile);
router.patch("/", checkCompanyProfileInput, CompanyProfileController.updateCompanyProfile);

module.exports = router;