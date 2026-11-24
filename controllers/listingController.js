const Listing = require('../models/Listing');
const User = require('../models/User');

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
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status: 'active' };

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
      query.condition = condition;
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
      .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl')
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
 * @desc    Get single listing by ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'sellerId',
      'name email averageRating ratingsCount universityId profilePictureUrl'
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Create a new listing
 * @route   POST /api/listings
 * @access  Private (Student)
 */
exports.createListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, images, imageUrl } = req.body;

    if (!title || !description || price === undefined || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, category, and condition',
      });
    }

    // Format images array
    let formattedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img, idx) =>
        typeof img === 'string'
          ? { imageUrl: img, displayOrder: idx }
          : { imageUrl: img.imageUrl, displayOrder: img.displayOrder || idx }
      );
    } else if (imageUrl) {
      formattedImages = [{ imageUrl, displayOrder: 0 }];
    }

    const listing = await Listing.create({
      sellerId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category: normalizeCategory(category) || category,
      condition,
      images: formattedImages,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating listing',
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
        condition: 'Like New',
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Logitech Wireless Silent Mouse M331',
        description: 'Used for only 1 semester in UTM KRP dorm. Perfect working condition, includes AA battery.',
        price: 45,
        category: 'Electronics',
        condition: 'Good',
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
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Official UTM Corporate Polo Shirt (Size L)',
        description: 'Worn only once during orientation week. Clean, washed, no stains.',
        price: 18,
        category: 'Clothing',
        condition: 'Like New',
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', displayOrder: 0 }],
        status: 'active',
      },
      {
        sellerId: demoSeller._id,
        title: 'Campus Commute Fixed Gear Bicycle',
        description: 'Great fixie bike for traveling between Kolej Perdana and faculty buildings. New brake pads.',
        price: 120,
        category: 'Other',
        condition: 'Good',
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
