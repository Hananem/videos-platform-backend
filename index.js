const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const { initSocket } = require('./socket'); // Import initSocket

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json()); // Parse JSON requests

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize the socket server
initSocket(server); // Call the initSocket function here

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/notifications', notificationRoutes);
// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { // Change to server.listen
    console.log(`Server is running on port ${PORT}`);
});
