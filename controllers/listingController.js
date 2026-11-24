const Listing = require('../models/Listing');
const User = require('../models/User'); // 注册 User schema，确保 populate('sellerId') 能正常工作
const cloudinary = require('../config/cloudinary');

// Helper to normalize category names across frontend and database
function normalizeCategory(cat) {
  if (!cat || cat === 'All') return null;
  const map = {
    'Dorm Essentials': 'Dorm',
    'Fashion': 'Clothing',
    'Sports': 'Other',
    'Dorm': 'Dorm',
    'Clothing': 'Clothing',
    'Textbooks': 'Textbooks',
    'Electronics': 'Electronics',
    'Services': 'Services',
    'Other': 'Other',
  };
  return map[cat] || cat;
}

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

        // 并发上传所有图片到 Cloudinary，或使用传入的图片 URL
        let images = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
            const imageUrls = await Promise.all(uploadPromises);
            images = imageUrls.map((url, index) => ({
                imageUrl: url,
                displayOrder: index,
            }));
        } else if (Array.isArray(req.body.images) && req.body.images.length > 0) {
            images = req.body.images.map((img, idx) =>
                typeof img === 'string'
                    ? { imageUrl: img, displayOrder: idx }
                    : { imageUrl: img.imageUrl, displayOrder: img.displayOrder || idx }
            );
        } else if (req.body.imageUrl) {
            images = [{ imageUrl: req.body.imageUrl, displayOrder: 0 }];
        }

        let parsedTags = [];
        if (req.body.tags) {
            parsedTags = Array.isArray(req.body.tags)
                ? req.body.tags
                : typeof req.body.tags === 'string'
                ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [];
        }

        const listing = await Listing.create({
            sellerId,
            title: title ? title.trim() : '',
            description: description ? description.trim() : '',
            price: Number(price),
            category: normalizeCategory(category) || category,
            condition,
            images,
            tags: parsedTags,
            status: 'active',
        });

        const listingObj = listing.toObject();
        res.status(201).json({
            ...listingObj,
            success: true,
            listing: listingObj,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single listing by ID
// @route   GET /api/listings/:id
exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate(
            'sellerId',
            'name email profilePictureUrl averageRating ratingsCount universityId verificationStatus'
        );

        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        const listingObj = listing.toObject();
        res.json({
            ...listingObj,
            success: true,
            listing: listingObj,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
                listing[field] = field === 'category' ? (normalizeCategory(req.body[field]) || req.body[field]) : req.body[field];
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
        const updatedObj = updatedListing.toObject();
        res.json({
            ...updatedObj,
            success: true,
            listing: updatedObj,
        });
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

        res.json({ success: true, message: 'Listing removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    T09: Search, filter, and sort listings
 * @route   GET /api/listings
 * @access  Public
 * @query   keyword, category, condition, minPrice, maxPrice, sort, page, limit
 */
exports.getListings = async (req, res) => {
  try {
    const {
      keyword,
      category,
      condition,
      minPrice,
      maxPrice,
      sort,
      sellerId,
      page = 1,
      limit = 50,
    } = req.query;

    const query = { status: 'active' };

    // Filter by seller ID (e.g. for My Listings or user profile)
    if (sellerId) {
      query.sellerId = sellerId;
    }

    // 1. Keyword search (regex on title or description)
    if (keyword && keyword.trim()) {
      const trimmed = keyword.trim();
      query.$or = [
        { title: { $regex: trimmed, $options: 'i' } },
        { description: { $regex: trimmed, $options: 'i' } },
      ];
    }

    // 2. Category filter
    const normalizedCat = normalizeCategory(category);
    if (normalizedCat) {
      query.category = normalizedCat;
    }

    // 3. Condition filter
    if (condition && condition !== 'All') {
      if (condition === 'Used') {
        query.condition = { $in: ['Used', 'Like New', 'Good', 'Fair', 'Poor'] };
      } else {
        query.condition = condition;
      }
    }

    // 4. Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        const min = Number(minPrice);
        if (!isNaN(min)) query.price.$gte = min;
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        const max = Number(maxPrice);
        if (!isNaN(max)) query.price.$lte = max;
      }
      // If price query ended up empty, clean it
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    // 5. Sorting logic
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // 6. Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl verificationStatus')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      listings,
    });
  } catch (error) {
    console.error('getListings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving listings',
    });
  }
};

/**
 * @desc    Seed initial sample listings if collection is empty
 * @route   POST /api/listings/seed
 * @access  Public
 */
exports.seedSampleListings = async (req, res) => {
  try {
    const count = await Listing.countDocuments();
    if (count > 0 && !req.query.force) {
      return res.status(200).json({
        success: true,
        message: `Database already contains ${count} listings. Pass ?force=true to re-seed.`,
      });
    }

    // Find or create a verified demo seller
    let demoSeller = await User.findOne({ email: 'seller@graduate.utm.my' });
    if (!demoSeller) {
      demoSeller = await User.create({
        name: 'Ahmad Faris',
        email: 'seller@graduate.utm.my',
        passwordHash: 'scrypt:demo:hash',
        universityId: 'A23CS0123',
        verificationStatus: 'verified',
        averageRating: 4.9,
        ratingsCount: 14,
      });
    }

    if (req.query.force) {
      await Listing.deleteMany({ sellerId: demoSeller._id });
    }

    const sampleListings = [
      {
        sellerId: demoSeller._id,
        title: 'Engineering Mathematics 1 (Calculus & Algebra)',
        description: 'Original textbook for first-year engineering students. No highlighted pages, like new.',
        price: 35,
        category: 'Textbooks',
        condition: 'Used',
        tags: ['mathematics', 'calculus', 'algebra', 'engineering', 'textbook'],
        viewsCount: 28,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Logitech Wireless Silent Mouse M331',
        description: 'Used for only 1 semester in UTM KRP dorm. Perfect working condition, includes AA battery.',
        price: 45,
        category: 'Electronics',
        condition: 'Used',
        tags: ['logitech', 'mouse', 'wireless', 'bluetooth', 'accessories'],
        viewsCount: 42,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Rechargeable LED Study Desk Lamp',
        description: 'Compact 3-level brightness study lamp with flexible neck. Ideal for late-night dorm study.',
        price: 20,
        category: 'Dorm',
        condition: 'New',
        tags: ['lamp', 'desk', 'dorm', 'led', 'study'],
        viewsCount: 19,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Official UTM Corporate Polo Shirt (Size L)',
        description: 'Worn only once during orientation week. Clean, washed, no stains.',
        price: 18,
        category: 'Clothing',
        condition: 'Used',
        tags: ['utm', 'polo', 'shirt', 'clothing', 'apparel'],
        viewsCount: 15,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Campus Commute Fixed Gear Bicycle',
        description: 'Great fixie bike for traveling between Kolej Perdana and faculty buildings. New brake pads.',
        price: 120,
        category: 'Other',
        condition: 'Used',
        tags: ['bicycle', 'commute', 'transport', 'sports', 'bike'],
        viewsCount: 35,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Laptop Thermal Paste & Deep Dust Cleaning Service',
        description: 'Computer Science student offering laptop servicing, overheating fixes, and fan dusting.',
        price: 25,
        category: 'Services',
        condition: 'New',
        tags: ['laptop', 'cleaning', 'service', 'repair', 'hardware'],
        viewsCount: 31,
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
    ];

    const inserted = await Listing.insertMany(sampleListings);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} sample marketplace listings!`,
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error seeding listings',
    });
  }
};
