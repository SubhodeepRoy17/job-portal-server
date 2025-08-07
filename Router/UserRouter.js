const express = require("express");
const UserRouter = express.Router();

// Import controller methods
const {
    getAllUser,
    getSingleUser,
    getMe,
    logOut,
    addUser,
    loginUser,
    updateResume,
    updateMobileVerification,
    updateMobileEdit,
    updateUser,
    deleteUser,
    deleteAllUser,
    addRecruiter,
    addCompany,
    googleAuth,
    googleAuthRecruiter,
    updateAcStatus,
    hibernateAccount,
    deleteAccountPermanently
} = require("../Controller/UserController");

const { clientPlatform } = require("../Middleware/clientPlatform");

// Import validation and middleware
const {
    checkRegisterInput,
    checkLoginInput,
    checkUserUpdateInput,
} = require("../Validation/UserDataRules");

const {
    inputValidationMiddleware,
} = require("../Validation/ValidationMiddleware");

const {
    userAuthorizationHandler,
} = require("../Middleware/UserAuthorizationMiddleware");

// User management routes
UserRouter.route("/")
    .get(userAuthorizationHandler(1), getAllUser)
    .delete(userAuthorizationHandler(1), deleteAllUser);

// Authentication routes
UserRouter.post("/register",
    clientPlatform,
    checkRegisterInput,
    inputValidationMiddleware,
    addUser
);

UserRouter.post("/register-recruiter",
    clientPlatform,
    checkRegisterInput,
    inputValidationMiddleware,
    addRecruiter
);

UserRouter.post("/register-company",
    clientPlatform,
    checkRegisterInput,
    inputValidationMiddleware,
    addCompany
);

UserRouter.patch("/update-mobile-verification",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4),
    express.json(),
    updateMobileVerification
);

UserRouter.patch("/update-mobile-edit",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4),
    express.json(),
    updateMobileEdit
);

UserRouter.patch("/update-resume",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4),
    express.json(),
    updateResume
);

UserRouter.post("/login",
    clientPlatform,
    checkLoginInput,
    inputValidationMiddleware,
    loginUser
);

UserRouter.post("/login-recruiter",
    clientPlatform,
    checkLoginInput,
    inputValidationMiddleware,
    loginUser
);

UserRouter.post("/login-company",
    clientPlatform,
    checkLoginInput,
    inputValidationMiddleware,
    loginUser
);

UserRouter.post("/google-auth",
    clientPlatform,
    express.json(),
    googleAuth
);

UserRouter.post("/google-auth-recruiter",
    clientPlatform,
    express.json(),
    googleAuthRecruiter
);

// Removed google-auth-company route

UserRouter.get("/me",
    clientPlatform,
    userAuthorizationHandler(2, 3, 4),
    getMe
);

UserRouter.get("/logout",
    clientPlatform,
    logOut
);

// Account status routes
UserRouter.patch("/update-account-status",
    clientPlatform,
    userAuthorizationHandler(3, 4),
    express.json(),
    updateAcStatus
);

UserRouter.patch("/hibernate-account",
    clientPlatform,
    userAuthorizationHandler(3, 4),
    express.json(),
    hibernateAccount
);

UserRouter.patch("/delete-account",
    clientPlatform,
    userAuthorizationHandler(3, 4),
    express.json(),
    deleteAccountPermanently
);

// User profile update
UserRouter.patch("/update",
    clientPlatform,
    userAuthorizationHandler(1, 2, 3, 4),
    express.json(),
    checkUserUpdateInput,
    inputValidationMiddleware,
    updateUser
);

// User management by ID
UserRouter.route("/:id")
    .get(userAuthorizationHandler(1, 2), getSingleUser)
    .delete(userAuthorizationHandler(1), deleteUser);

module.exports = UserRouter;