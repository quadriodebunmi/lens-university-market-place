import express from 'express';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import cache from '../utils/cache.js';

const router = express.Router();

// // ─── GET /api/sellers — public ──────────────────────────────────────────────
// router.get('/', async (req, res) => {
//   try {
//     const cacheKey = `sellers:list:${JSON.stringify(req.query)}`;
//     const cached   =await cache.get(cacheKey);
//     if (cached) return res.json(cached);

//     const { page=1, limit=12, sort='createdAt', order='desc', category, search, minRating } = req.query;
//     const query = { isActive: true, isApproved: true };
//     if (category && category !== 'All') query.category = category;
//     if (minRating) query.rating = { $gte: parseFloat(minRating) };
//     if (search) query.$or = [
//       { store_name:  { $regex: search, $options: 'i' } },
//       { username:    { $regex: search, $options: 'i' } },
//       { description: { $regex: search, $options: 'i' } },
//     ];

//     const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
//     const total   = await Seller.countDocuments(query);
//     const sellers = await Seller.find(query).select('-password').sort(sortObj).skip((page-1)*limit).limit(parseInt(limit));

//     const result = { success: true, sellers, pagination: { total, page: parseInt(page), pages: Math.ceil(total/limit), limit: parseInt(limit) } };
//   await cache.set(cacheKey, result, 60); // 60 s
//     res.json(result);
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// });

// ─── GET /api/sellers — public (TikTok Smart Mix with sort options) ─────────
router.get('/', async (req, res) => {
  try {
    const cacheKey = `sellers:list:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { 
      page = 1, 
      limit = 12, 
      sort = 'tiktokScore',  // DEFAULT is now tiktokScore
      order = 'desc', 
      category, 
      search, 
      minRating 
    } = req.query;

    const query = { 
      isActive: true, 
      isApproved: true,
    //  token_expires_at: { $gt: new Date() }
    };
    
    if (category && category !== 'All') query.category = category;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (search) query.$or = [
      { store_name:  { $regex: search, $options: 'i' } },
      { username:    { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const limitNum = parseInt(limit);
    const total = await Seller.countDocuments(query);
    
    let sellers;
    
    // If sorting by TikTok Smart Mix (default)
    if (sort === 'tiktokScore') {
      const skip = (parseInt(page) - 1) * limitNum;
      
      // Define ratios (40% top-rated, 40% new, 20% random)
      const topRatedCount = Math.floor(limitNum * 0.4);
      const newCount = Math.floor(limitNum * 0.4);
      const randomCount = limitNum - topRatedCount - newCount;
      
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const categoryPage = Math.floor(skip / limitNum) + 1;
      const categorySkip = (categoryPage - 1) * limitNum;
      
      let topRatedSellers = [];
      let newSellers = [];
      let randomSellers = [];
      
      // 1. Top-rated sellers
      if (topRatedCount > 0) {
        topRatedSellers = await Seller.find({ 
          ...query, 
          rating: { $gte: 4 }
        })
          .select('-password')
          .sort({ rating: -1, createdAt: -1 })
          .skip(categorySkip)
          .limit(topRatedCount)
          .lean();
      }
      
      // 2. New sellers
      if (newCount > 0) {
        const existingIds = topRatedSellers.map(s => s._id);
        newSellers = await Seller.find({ 
          ...query, 
          createdAt: { $gte: oneMonthAgo },
          _id: { $nin: existingIds }
        })
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(categorySkip)
          .limit(newCount)
          .lean();
      }
      
      // 3. Random discovery sellers
      if (randomCount > 0) {
        const existingIds = [
          ...topRatedSellers.map(s => s._id),
          ...newSellers.map(s => s._id)
        ];
        
        randomSellers = await Seller.aggregate([
          { $match: { ...query, _id: { $nin: existingIds } } },
          { $sample: { size: randomCount + (skip * 2) } }
        ]);
        
        randomSellers = randomSellers.slice(skip, skip + randomCount);
        randomSellers = randomSellers.map(({ password, ...seller }) => seller);
      }
      
      // Combine and interleave
      let allSelected = [];
      const maxLen = Math.max(topRatedSellers.length, newSellers.length, randomSellers.length);
      
      for (let i = 0; i < maxLen; i++) {
        if (topRatedSellers[i]) allSelected.push(topRatedSellers[i]);
        if (newSellers[i]) allSelected.push(newSellers[i]);
        if (randomSellers[i]) allSelected.push(randomSellers[i]);
      }
      
      // Deterministic shuffle
      const seed = parseInt(page);
      sellers = deterministicShuffle(allSelected, seed);
    } 
    // If sorting by createdAt, rating, or other fields
    else {
      const sortObj = {};
      sortObj[sort] = order === 'asc' ? 1 : -1;
      
      sellers = await Seller.find(query)
        .select('-password')
        .sort(sortObj)
        .skip((parseInt(page) - 1) * limitNum)
        .limit(limitNum)
        .lean();
    }

    const result = { 
      success: true, 
      sellers, 
      pagination: { 
        total, 
        page: parseInt(page), 
        pages: Math.ceil(total / limitNum), 
        limit: limitNum 
      } 
    };
    
    await cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
});

// Helper function for deterministic shuffling
function deterministicShuffle(array, seed) {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let random;
  
  while (currentIndex !== 0) {
    const x = Math.sin(seed + currentIndex) * 10000;
    random = Math.floor((x - Math.floor(x)) * currentIndex);
    currentIndex--;
    
    [shuffled[currentIndex], shuffled[random]] = [shuffled[random], shuffled[currentIndex]];
  }
  
  return shuffled;
}


// ─── GET /api/sellers/admin/all — admin ─────────────────────────────────────
router.get('/admin/all', protect, async (req, res) => {
  try {
    const cacheKey = `sellers:admin:${JSON.stringify(req.query)}`;
    const cached   =await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { page=1, limit=20, sort='createdAt', order='desc', category, search } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (search) query.$or = [
      { store_name: { $regex: search, $options: 'i' } },
      { username:   { $regex: search, $options: 'i' } },
    ];

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
    const total   = await Seller.countDocuments(query);
    const sellers = await Seller.find(query).select('-password').sort(sortObj).skip((page-1)*limit).limit(parseInt(limit));

    const result = { success: true, sellers, pagination: { total, page: parseInt(page), pages: Math.ceil(total/limit), limit: parseInt(limit) } };
   await cache.set(cacheKey, result, 20); // admin sees fresher data
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/sellers/:id — public ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `seller:${req.params.id}`;
    const cached   =await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const seller = await Seller.findById(req.params.id).select('-password');
    if (!seller || !seller.isActive) return res.status(404).json({ success: false, message: 'Seller not found' });

    const now = new Date();
    const hasToken = seller.token_expires_at && new Date(seller.token_expires_at) > now;

    // Only show products if seller has active token
    const products = hasToken
      ? await Product.find({
          seller: seller._id,
          isActive: true,
          $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
        }).populate('seller', 'store_name username profile_picture rating category contact website social_media_handle whatsapp token_expires_at')
      : [];

    const result = { success: true, seller, products };
   await cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/sellers/:username — public ──────────────────────────────────────────
router.get('/user/:username', async (req, res) => {
 // console.log(req.params.username)
  try {
    const cacheKey = `seller:${req.params.username}`;
    const cached   =await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const seller = await Seller.findOne({username: req.params.username}).select('-password');
    if (!seller || !seller.isActive) return res.status(404).json({ success: false, message: 'Seller not found' });

    const now = new Date();
    const hasToken = seller.token_expires_at && new Date(seller.token_expires_at) > now;

    // Only show products if seller has active token
    const products = hasToken
      ? await Product.find({
          seller: seller._id,
          isActive: true,
          $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
        }).populate('seller', 'store_name username profile_picture rating category contact website social_media_handle whatsapp token_expires_at')
      : [];

    const result = { success: true, seller, products };
   await cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/sellers — admin creates seller ────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body };
    data.isApproved = true;
    if (!data.password) data.password = Math.random().toString(36).slice(-8);
    const seller = new Seller(data);
    await seller.save();
    const out = seller.toObject(); delete out.password;
  await  cache.delPrefix('sellers:');
    res.status(201).json({ success: true, seller: out, message: 'Seller created successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Username or email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/sellers/:id — admin updates seller ─────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.password;
    const seller = await Seller.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select('-password');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
   await cache.delPrefix('sellers:');
  await  cache.del(`seller:${req.params.id}`);
    res.json({ success: true, seller, message: 'Seller updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PATCH /api/sellers/:id/approve — admin approve/suspend ─────────────────
router.patch('/:id/approve', protect, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const seller = await Seller.findByIdAndUpdate(req.params.id, { isApproved }, { new: true }).select('-password');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
  await  cache.delPrefix('sellers:');
  await  cache.del(`seller:${req.params.id}`);
   await cache.delPrefix('products:'); // seller approval affects visible products
    res.json({ success: true, seller, message: `Seller ${isApproved ? 'approved' : 'suspended'}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/sellers/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    await Product.deleteMany({ seller: req.params.id });
  await  cache.delPrefix('sellers:');
  await  cache.del(`seller:${req.params.id}`);
  await  cache.delPrefix('products:');
    res.json({ success: true, message: 'Seller and products deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
