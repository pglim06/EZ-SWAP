const Listing = require('../models/Listing');
const User = require('../models/User'); // 注册 User schema，确保 populate('sellerId') 能正常工作
const cloudinary = require('../config/cloudinary');
const { getPriceInsightForListing } = require('../utils/priceInsight');
const { analyzeProductImage } = require('../utils/aiImageAnalyzer');
const { SUBCATEGORY_DATA, DEMO_SELLERS, SUBCATEGORY_IMAGES } = require('../scripts/seedCategories');
const { shuffleDiverse } = require('../utils/shuffleDiverse');

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

        let parsedCoordinates = { lat: null, lng: null };
        if (req.body.coordinates) {
            try {
                const rawCoords = typeof req.body.coordinates === 'string'
                    ? JSON.parse(req.body.coordinates)
                    : req.body.coordinates;
                if (rawCoords && Number.isFinite(Number(rawCoords.lat)) && Number.isFinite(Number(rawCoords.lng))) {
                    parsedCoordinates = { lat: Number(rawCoords.lat), lng: Number(rawCoords.lng) };
                }
            } catch {
                // Ignore malformed coordinates
            }
        }

        const listing = await Listing.create({
            sellerId,
            title: title ? title.trim() : '',
            description: description ? description.trim() : '',
            price: Number(price),
            category: normalizeCategory(category) || category,
            condition,
            location: req.body.location ? String(req.body.location).trim() : '',
            coordinates: parsedCoordinates,
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
        listingObj.condition = listingObj.condition === 'New' ? 'New' : 'Used';
        const priceInsight = await getPriceInsightForListing(listingObj);
        listingObj.priceInsight = priceInsight;

        res.json({
            ...listingObj,
            success: true,
            listing: listingObj,
            priceInsight,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get price insight quartile statistics for a listing
// @route   GET /api/listings/:id/price-insight
exports.getListingPriceInsight = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).lean();
        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        const priceInsight = await getPriceInsightForListing(listing);
        res.json({
            success: true,
            priceInsight,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.analyzeImage = async (req, res) => {
    try {
        const { imageUrl, title, category, condition, price } = req.body || {};
        if (!req.file && !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image or provide an imageUrl.',
            });
        }

        const analysis = await analyzeProductImage({
            buffer: req.file?.buffer,
            mimeType: req.file?.mimetype,
            imageUrl,
            context: { title, category, condition, price },
        });

        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'AI image analysis failed',
        });
    }
};

exports.analyzeListingPhoto = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).lean();
        if (!listing || listing.status === 'removed') {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        const requestedUrl = req.body?.imageUrl;
        const primaryUrl =
            requestedUrl ||
            listing.images?.[0]?.imageUrl ||
            (typeof listing.images?.[0] === 'string' ? listing.images[0] : null);

        if (!primaryUrl) {
            return res.status(400).json({
                success: false,
                message: 'This listing has no photo to analyze.',
            });
        }

        const analysis = await analyzeProductImage({
            imageUrl: primaryUrl,
            context: {
                title: listing.title,
                category: listing.category,
                condition: listing.condition,
                price: listing.price,
            },
        });

        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'AI image analysis failed',
        });
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

        const allowedFields = ['title', 'description', 'price', 'category', 'condition', 'status', 'location'];
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                listing[field] = field === 'category' ? (normalizeCategory(req.body[field]) || req.body[field]) : req.body[field];
            }
        });

        if (req.body.coordinates !== undefined) {
            try {
                const rawCoords = typeof req.body.coordinates === 'string'
                    ? JSON.parse(req.body.coordinates)
                    : req.body.coordinates;
                if (rawCoords && Number.isFinite(Number(rawCoords.lat)) && Number.isFinite(Number(rawCoords.lng))) {
                    listing.coordinates = { lat: Number(rawCoords.lat), lng: Number(rawCoords.lng) };
                } else {
                    listing.coordinates = { lat: null, lng: null };
                }
            } catch {
                // Ignore malformed coordinates
            }
        }

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
      limit = 1000,
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
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit || 1000, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl verificationStatus')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    let normalizedListings = listings.map((l) => {
      const obj = l.toObject ? l.toObject() : { ...l };
      obj.condition = obj.condition === 'New' ? 'New' : 'Used';
      return obj;
    });

    // Shuffle without placing similar ads together
    if (sort === 'shuffle' || sort === 'random') {
      normalizedListings = shuffleDiverse(normalizedListings);
    }

    res.status(200).json({
      success: true,
      count: normalizedListings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      listings: normalizedListings,
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

    // 1. Ensure demo sellers exist
    const sellerIds = [];
    for (const s of DEMO_SELLERS) {
      let user = await User.findOne({ email: s.email });
      if (!user) {
        user = await User.create({
          ...s,
          passwordHash: 'scrypt:demo:hash',
          verificationStatus: 'verified',
          isEmailApproved: true,
          role: 'student',
        });
      }
      sellerIds.push(user._id);
    }

    // 2. Clear old seeded listings if force=true
    if (req.query.force) {
      await Listing.deleteMany({ sellerId: { $in: sellerIds } });
    }

    // 3. Build all listings from SUBCATEGORY_DATA
    const docs = [];
    let idx = 0;
    for (const group of SUBCATEGORY_DATA) {
      for (const item of group.items) {
        const sellerId = sellerIds[idx % sellerIds.length];
        docs.push({
          sellerId,
          title: item.title,
          description: item.desc,
          price: item.price,
          category: group.category,
          condition: item.condition,
          tags: [
            group.category.toLowerCase(),
            group.subcategory.toLowerCase(),
            item.condition.toLowerCase(),
          ],
          viewsCount: (idx * 7) % 85 + 5,
          images: [{ imageUrl: SUBCATEGORY_IMAGES[group.subcategory], displayOrder: 0 }],
          status: 'active',
        });
        idx++;
      }
    }

    const inserted = await Listing.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} comprehensive sample marketplace listings across all categories!`,
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error seeding listings',
    });
  }
};
