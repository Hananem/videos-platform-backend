const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Updated bcrypt to bcryptjs
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../validation/authValidation');


// Register
const register = async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using bcryptjs
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
};

// Login
const login = async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password); // Compare password using bcryptjs
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '60d' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(400).json({ message: 'Login failed', error: error.message });
    }
};

// Get User (example)
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: 'Failed to retrieve user', error: error.message });
    }
};

// Export functions
module.exports = {
    register,
    login,
    getUser,
};
