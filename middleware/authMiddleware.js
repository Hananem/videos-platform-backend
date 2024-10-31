const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
        const user = await User.findById(decoded.id);  // Find user by the decoded 'id'

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;  // Attach user to the request object
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

module.exports = authMiddleware;


