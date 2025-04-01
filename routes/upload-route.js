const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event-management", // Change folder name as needed
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  },
});

const upload = multer({ storage: storage });

// File Upload Route
router.post("/", upload.single("file"), async(req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      res.json({ fileUrl: req.file.path }); // Cloudinary returns a URL
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

module.exports = router;
