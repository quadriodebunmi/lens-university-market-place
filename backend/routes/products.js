import express from 'express';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import { protect } from '../middleware/auth.js';
import cache from '../utils/cache.js';

const router = express.Router();

// Mark expired products inactive (run before public queries)
const cleanExpired = async () => {
  await Product.updateMany(
    { expires_at: { $ne: null, $lte: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
};

// ─── GET /api/products — public ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    await cleanExpired();

    const {
      page=1, limit=12, sort='createdAt', order='desc',
      category, search, seller, minPrice, maxPrice
    } = req.query;

    const cacheKey = `products:list:${JSON.stringify(req.query)}`;
    const cached   =await cache.get(cacheKey);
    //console.log(cached)
    if (cached) return res.json(cached);

    // Only show products that belong to sellers with an active token
    const now = new Date();
    const activeSellers = await Seller.find({
      isApproved: true,
      isActive:   true,
      token_expires_at: { $gt: now },  // seller's token must be valid
    }).select('_id');

    const activeSellersIds = activeSellers.map(s => s._id);

    const query = {
      isActive: true,
      seller:   { $in: activeSellersIds },
    };

    if (category && category !== 'All') query.category = category;
    if (seller) {
      // If filtering by specific seller, still require active token
      query.seller = activeSellersIds.includes(seller) ? seller : { $in: [] };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) query.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const sortObj = sort === 'rating' ? {} : { [sort]: order === 'asc' ? 1 : -1 };
    const total   = await Product.countDocuments(query);
    let products  = await Product.find(query)
      .populate('seller', 'store_name username profile_picture rating category whatsapp')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (sort === 'rating') {
      products = products.sort((a, b) =>
        order === 'asc'
          ? (a.seller?.rating || 0) - (b.seller?.rating || 0)
          : (b.seller?.rating || 0) - (a.seller?.rating || 0)
      );
    }

    const result = {
      success: true, products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    };

   await cache.set(cacheKey, result, 30); // cache public product list for 30 s
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/products/admin/all — admin ────────────────────────────────────
router.get('/admin/all', protect, async (req, res) => {
  try {
    const { page=1, limit=20, sort='createdAt', order='desc', category, search, seller } = req.query;

    const cacheKey = `products:admin:${JSON.stringify(req.query)}`;
    const cached   = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const query = {};
    if (category && category !== 'All') query.category = category;
    if (seller) query.seller = seller;
    if (search) query.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const sortObj  = { [sort]: order === 'asc' ? 1 : -1 };
    const total    = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', 'store_name username profile_picture token_expires_at')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const result = { success: true, products, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } };
   await cache.set(cacheKey, result, 20);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/products/:id — public ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `products:single:${req.params.id}`;
    const cached   =await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const product = await Product.findById(req.params.id)
      .populate('seller', 'store_name username profile_picture rating category contact website social_media_handle whatsapp token_expires_at');

    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });

    const result = { success: true, product };
   await cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/products — admin creates product ──────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.expiry_duration_hours && Number(data.expiry_duration_hours) > 0) {
      const h = Number(data.expiry_duration_hours);
      data.expires_at = new Date(Date.now() + h * 3600000);
      data.expiry_duration_hours = h;
    } else {
      data.expires_at = null;
      data.expiry_duration_hours = null;
    }

    const seller = await Seller.findById(data.seller);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const product = new Product(data);
    await product.save();
    await product.populate('seller', 'store_name username profile_picture rating whatsapp');

   await cache.delPrefix('products:');
    res.status(201).json({ success: true, product, message: 'Product created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/products/:id — admin updates product ───────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.expiry_duration_hours !== undefined) {
      const h = Number(data.expiry_duration_hours);
      if (h > 0) { data.expires_at = new Date(Date.now() + h * 3600000); data.expiry_duration_hours = h; }
      else        { data.expires_at = null; data.expiry_duration_hours = null; }
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('seller', 'store_name username profile_picture rating whatsapp');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await cache.delPrefix('products:');
    res.json({ success: true, product, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/products/:id — admin only ───────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
   await cache.delPrefix('products:');
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
