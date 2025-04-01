const jwt = require("jsonwebtoken");
const User = require("../models/user-model"); // Ensure User model is imported

const validateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decryptedObj = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decryptedObj._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = validateToken;
