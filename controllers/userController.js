const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

/**
 * Helper function: 将内存中的图片 Buffer 上传至 Cloudinary (头像目录)
 */
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'ez-swap/avatars' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

// @desc    Get user profile by ID (Public & Private view)
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        // 如果是无效的 ObjectId 格式
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (bio, universityId, name, avatar)
// @route   PUT /api/users/:id
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 允许更新的文本字段
        const allowedFields = ['name', 'bio', 'universityId'];
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        // 如果用户上传了新头像 (单张图片)
        if (req.file) {
            const avatarUrl = await uploadToCloudinary(req.file.buffer);
            user.profilePictureUrl = avatarUrl;
        } else if (req.body.profilePictureUrl !== undefined) {
            user.profilePictureUrl = req.body.profilePictureUrl;
        }

        const updatedUser = await user.save();

        // 排除 passwordHash 后返回
        const userObj = updatedUser.toObject();
        delete userObj.passwordHash;

        res.json(userObj);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
