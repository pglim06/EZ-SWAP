const Listing = require('../models/Listing');
require('../models/User'); // 注册 User schema，确保 populate('sellerId') 能正常工作
const cloudinary = require('../config/cloudinary');

/**
 * Helper function: 将内存中的 file Buffer 通过 stream 上传到 Cloudinary
 */
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'ez-swap/listings' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

// @desc    Create a new listing (with optional image uploads)
// @route   POST /api/listings
exports.createListing = async (req, res) => {
    try {
        const { title, description, price, category, condition } = req.body;
        // 兼容阶段：若 T07 auth middleware 尚未合并，允许从 req.body.sellerId 传入测试用 User ID
        const sellerId = req.user ? req.user._id : req.body.sellerId;

        if (!sellerId) {
            return res.status(400).json({ message: 'sellerId is required' });
        }

        // 并发上传所有图片到 Cloudinary
        let images = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
            const imageUrls = await Promise.all(uploadPromises);
            images = imageUrls.map((url, index) => ({
                imageUrl: url,
                displayOrder: index,
            }));
        }

        const listing = await Listing.create({
            sellerId,
            title,
            description,
            price,
            category,
            condition,
            images,
        });

        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all active listings
// @route   GET /api/listings
exports.getListings = async (req, res) => {
    try {
        const filter = { status: 'active' };
        if (req.query.category) filter.category = req.query.category;
        if (req.query.sellerId) filter.sellerId = req.query.sellerId;

        const listings = await Listing.find(filter)
            .populate('sellerId', 'name profilePictureUrl averageRating ratingsCount verificationStatus')
            .sort({ createdAt: -1 });

        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single listing by ID
// @route   GET /api/listings/:id
exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate(
            'sellerId',
            'name email profilePictureUrl averageRating ratingsCount verificationStatus'
        );

        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
exports.updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // 权限校验（若已接入 auth middleware）
        if (req.user && listing.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        const allowedFields = ['title', 'description', 'price', 'category', 'condition', 'status'];
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                listing[field] = req.body[field];
            }
        });

        // 1. 根据前端传来的 keepImageIds 过滤掉被用户删除的旧图片
        if (req.body.keepImageIds !== undefined) {
            const keepIds = JSON.parse(req.body.keepImageIds);
            listing.images = listing.images.filter((img) =>
                keepIds.includes(img._id.toString())
            );
        }

        // 2. 如果有上传新图片，追加到现有 images 数组中
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
            const newUrls = await Promise.all(uploadPromises);
            const newImages = newUrls.map((url) => ({
                imageUrl: url,
                displayOrder: 0,
            }));
            listing.images.push(...newImages);
        }

        // 3. 重新整理所有图片的 displayOrder（0, 1, 2...）
        listing.images.forEach((img, index) => {
            img.displayOrder = index;
        });

        const updatedListing = await listing.save();
        res.json(updatedListing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Soft delete a listing (set status to 'removed')
// @route   DELETE /api/listings/:id
exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (req.user && listing.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        listing.status = 'removed';
        await listing.save();

        res.json({ message: 'Listing removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};