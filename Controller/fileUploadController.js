// fileUploadController.js - Updated for Vercel
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Use memory storage instead of disk storage for Vercel
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    // In Vercel, we need to use an external storage service
    // For now, just return a mock response
    const mockFileUrl = `https://example.com/uploads/${uuidv4()}${path.extname(req.file.originalname)}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: mockFileUrl,
        filename: req.file.originalname
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

exports.getUploadMiddleware = () => upload.single('file');