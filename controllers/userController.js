const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');
const { getIo } = require('../socket');

// Fetch user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password'); // Exclude password for security

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve user', error: error.message });
    }
};

// Function to update user's username, password, bio, and email
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId; // Get userId from the authenticated user
        const { username, password, bio, email } = req.body;

        // Prepare update data object
        const updateData = {};

        // Update username if provided
        if (username) updateData.username = username;

        // Update password if provided
        if (password) {
            // Hash the password before saving (optional, but recommended)
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        // Update bio if provided
        if (bio !== undefined) updateData.bio = bio; // Use !== to allow empty string as a valid value

        // Update email if provided
        if (email) updateData.email = email;

        // Update the user profile
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
};

// Function to remove bio
const removeBio = async (req, res) => {
    try {
        const userId = req.userId; // Get userId from the authenticated user
        
        // Update user's bio to an empty string
        const updatedUser = await User.findByIdAndUpdate(userId, { bio: '' }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove bio', error: error.message });
    }
};

// Function to upload profile picture
const uploadProfilePic = async (req, res) => {
    try {
        const userId = req.user._id; // Use user._id from the request object
        
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Update user's profile picture
        const profilePicPath = `/uploads/images/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: profilePicPath }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
    }
};

// Function to upload background image
const uploadBackgroundImage = async (req, res) => {
    try {
        const userId = req.user._id; // Use user._id from the request object
        
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Update user's background image
        const backgroundImgPath = `/uploads/images/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(userId, { backgroundImg: backgroundImgPath }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload background image', error: error.message });
    }
};


// Function to remove profile picture
const removeProfilePic = async (req, res) => { 
    try {
        const userId = req.user._id; // Use userId from the token
        
        // Update user's profile picture to default URL
        const updatedUser = await User.findByIdAndUpdate(userId, { 
            profilePic: 'https://cdn.dribbble.com/users/2442273/screenshots/11430325/media/f7c16720aa0680f356a6b863b7ddf23a.gif' 
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove profile picture', error: error.message });
    }
};

// Function to remove background image
const removeBackgroundImage = async (req, res) => {
    try {
        const userId = req.user._id; // Use user._id from the request object
        
        // Update user's background image to default value
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { backgroundImg: 'https://i.pinimg.com/originals/74/5c/c9/745cc90fcc688569610f84bc5d2b2fd6.gif' }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove background image', error: error.message });
    }
};

// Follow a user
const followUser = async (req, res) => {
    try {
        const userIdToFollow = req.params.userId; // ID of the user to follow
        const currentUserId = req.user.id; // ID of the currently authenticated user

        // Check if the user is trying to follow themselves
        if (currentUserId === userIdToFollow) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }

        // Find the user to follow
        const userToFollow = await User.findById(userIdToFollow);
        if (!userToFollow) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if already following
        if (userToFollow.followers.includes(currentUserId)) {
            return res.status(400).json({ message: "You are already following this user." });
        }

        // Add to followers and following arrays
        userToFollow.followers.push(currentUserId);
        await userToFollow.save();

        const currentUser = await User.findById(currentUserId);
        currentUser.following.push(userIdToFollow);
        await currentUser.save();

        // Create a notification for the user being followed
        const notification = new Notification({
            recipient: userIdToFollow, // The user who is being followed
            sender: currentUserId, // The user who is following
            type: 'follow', // Type of notification
            isRead: false, // Set as unread
            message: `${currentUser.username} has followed you.`, // Personalized message
        });

        await notification.save();

        // Emit the notification via Socket.IO (optional)
        const io = getIo();
        io.to(userIdToFollow.toString()).emit('receiveNotification', notification);

        res.status(200).json({ message: "Successfully followed the user." });
    } catch (error) {
        res.status(500).json({ message: "Error following user", error: error.message });
    }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
    try {
        const userIdToUnfollow = req.params.userId; // ID of the user to unfollow
        const currentUserId = req.user.id; // ID of the currently authenticated user

        // Find the user to unfollow
        const userToUnfollow = await User.findById(userIdToUnfollow);
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if currently following
        const currentUser = await User.findById(currentUserId);
        if (!currentUser.following.includes(userIdToUnfollow)) {
            return res.status(400).json({ message: "You are not following this user." });
        }

        // Remove from followers and following arrays
        userToUnfollow.followers.pull(currentUserId);
        await userToUnfollow.save();

        currentUser.following.pull(userIdToUnfollow);
        await currentUser.save();

        res.status(200).json({ message: "Successfully unfollowed the user." });
    } catch (error) {
        res.status(500).json({ message: "Error unfollowing user", error: error.message });
    }
};

const getFollowedUsersVideos = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Get the list of followed users
        const currentUser = await User.findById(currentUserId).select("following");

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (currentUser.following.length === 0) {
            return res.status(200).json({ message: "No followed users", videos: [] });
        }

        // Get videos from followed users based on privacy settings
        const videos = await Video.find({
            createdBy: { $in: currentUser.following },
            $or: [
                { privacyStatus: "public" },
                { privacyStatus: "followers" },
                { createdBy: currentUserId }  // Allow private videos of the current user
            ]
        })
        .populate('createdBy', 'username profilePic')
        .sort({ createdAt: -1 });

        res.status(200).json({ message: "Videos from followed users fetched successfully.", videos });
    } catch (error) {
        console.error("Error fetching followed users' videos:", error);
        res.status(500).json({ message: "Error fetching followed users' videos", error: error.message });
    }
};

const watchVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Check if video was watched by this user within the last 5 minutes
        const watchedEntry = user.watchedVideos.find((entry) => 
            entry.video.equals(video._id)
        );

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        if (!watchedEntry || watchedEntry.lastWatchedAt < fiveMinutesAgo) {
            // Increment the view count on the video
            video.views += 1;
            await video.save();

            // Update or add to the watched entry
            if (watchedEntry) {
                watchedEntry.lastWatchedAt = new Date();
            } else {
                user.watchedVideos.push({
                    video: video._id,
                    lastWatchedAt: new Date()
                });
            }

            await user.save();
        }

        res.status(200).json({ message: 'Video watched successfully', video });
    } catch (error) {
        res.status(500).json({ message: 'Error watching video', error: error.message });
    }
};

const getSuggestedVideos = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Fetch the user's watched and saved videos
        const user = await User.findById(currentUserId)
            .populate({
                path: 'watchedVideos.video', // Assuming `watchedVideos` is an array of video objects
                select: 'category tags'
            })
            .populate({
                path: 'savedVideos', // Assuming `savedVideos` is an array of saved video IDs
                select: 'category tags'
            });

        // Extract categories and tags from watched videos
        const watchedCategories = user.watchedVideos.map(video => video.video.category);
        const watchedTags = user.watchedVideos.flatMap(video => video.video.tags);
        
        // Extract categories and tags from saved videos
        const savedCategories = user.savedVideos.map(video => video.category);
        const savedTags = user.savedVideos.flatMap(video => video.tags);

        // Find videos based on categories and tags from watched and saved videos
        const suggestedVideos = await Video.find({
            $or: [
                { category: { $in: [...watchedCategories, ...savedCategories] } },
                { tags: { $in: [...watchedTags, ...savedTags] } }
            ],
            createdBy: { $ne: currentUserId } // Exclude videos created by the user
        })
        .sort({ views: -1, createdAt: -1 }) // Sort by popularity and recency
        .limit(10) // Limit to 10 suggestions for efficiency
        .populate('createdBy', 'username profilePic'); // Populate video creator details

        // Fallback: If not enough suggested videos, find popular videos platform-wide
        if (suggestedVideos.length < 10) {
            const popularVideos = await Video.find({ createdBy: { $ne: currentUserId } })
                .sort({ views: -1 })
                .limit(10 - suggestedVideos.length)
                .populate('createdBy', 'username profilePic');
            suggestedVideos.push(...popularVideos);
        }

        res.status(200).json({
            message: 'Suggested videos fetched successfully',
            videos: suggestedVideos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching suggested videos', error: error.message });
    }
};
module.exports = { 
    followUser, 
    unfollowUser,
    getUserById,
    updateUserProfile,
    removeBio,
    uploadProfilePic,
    uploadBackgroundImage,
    removeProfilePic,
    removeBackgroundImage,
    getSuggestedVideos,
    watchVideo,
    getFollowedUsersVideos
 };
