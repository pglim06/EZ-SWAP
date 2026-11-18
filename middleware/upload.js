const multer = require('multer');

// 使用 memoryStorage 将上传的文件先保存在内存 Buffer 中，无需写入本地磁盘
const storage = multer.memoryStorage();

// 校验上传的文件格式，只允许主流图片类型
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and WEBP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制单张图片最大 5MB
    },
    fileFilter: fileFilter,
});

module.exports = upload;