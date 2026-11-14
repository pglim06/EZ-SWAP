const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    getUserProfile,
    updateUserProfile,
} = require('../controllers/userController');

// 公开获取用户 Profile
// 当访问 GET /api/users/:id 时，调用 getUserProfile
router.get('/:id', getUserProfile);

// 更新用户 Profile（支持单个 avatar 图片上传）
// 当访问 PUT /api/users/:id 时，支持单张图片 upload.single('avatar')，然后调用 updateUserProfile
router.put('/:id', upload.single('avatar'), updateUserProfile);

module.exports = router;
