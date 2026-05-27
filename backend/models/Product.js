import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Books', 'Food & Beverages', 'Health & Beauty', 'Sports', 'Home & Living', 'Services', 'Art & Crafts', 'Other']
  },
  product_image: {
    type: String,
    default: ''
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  time_frame: {
    type: String,
    default: ''  // display label e.g. "Available Mon-Fri"
  },
  expires_at: {
    type: Date,
    default: null   // null = never expires; set by admin
  },
  expiry_duration_hours: {
    type: Number,
    default: null   // how many hours admin chose (stored for display)
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
