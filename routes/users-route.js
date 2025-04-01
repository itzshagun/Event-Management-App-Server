// user-route.js
const express = require("express");
const router = express.Router();
const User = require("../models/user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateToken = require("../middlewares/validate-token");

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "User registered successfully",
      user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
    return res.status(200).json({ token, message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get Current User
router.get("/current-user", validateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    // console.log("User Data:", user);
    return res.status(200).json({ data: user, message: "User fetched successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//get all users
router.get("/get-all-users", validateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ data: users, message: "User fetched successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});



// Update User
router.put("/update-user", validateToken, async (req, res) => {
  try {
    const { name, email, oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    const updatedUser = await user.save();
    return res.status(200).json({
      message: "User updated successfully",
      user: { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
