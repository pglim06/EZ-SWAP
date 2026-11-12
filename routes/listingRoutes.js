const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    createListing,
    getListings,
    getListingById,
    updateListing,
    deleteListing,
} = require('../controllers/listingController');

// 公开读取路由
router.get('/', getListings);
router.get('/:id', getListingById);

// 写入/修改路由（使用 upload.array('images', 5) 最多接收 5 张名为 images 的图片文件）
router.post('/', upload.array('images', 5), createListing);
router.put('/:id', upload.array('images', 5), updateListing);
router.delete('/:id', deleteListing);

module.exports = router;