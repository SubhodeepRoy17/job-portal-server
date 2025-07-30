const dotenv = require("dotenv").config();
const app = require("./App");
const path = require("path");

// PostgreSQL DB Connection
const connectDB = require("./Utils/DBconnect");
connectDB(); // Call the async function to connect to PostgreSQL

const port = process.env.PORT || 3000;

// Ensure upload directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Health check endpoint
app.get("/", (req, res) => {
    res.send("Job Hunter Server is running!");
});

// 404 Error handler
app.use("*", (req, res) => {
    res.status(404).json({ 
        success: false,
        message: "Not Found",
        error: "The requested resource was not found on this server"
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Something went wrong",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Upload directory: ${uploadDir}`);
});