export const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Books',
  'Food & Beverages',
  'Health & Beauty',
  'Sports',
  'Home & Living',
  'Services',
  'Art & Crafts',
  'Other'
];

export const CATEGORIES_NO_ALL = CATEGORIES.slice(1);

export const SORT_OPTIONS = [
    { value: 'tiktokScore', label: 'default sort', order: null },
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'createdAt', label: 'Oldest First', order: 'asc' },
  { value: 'rating', label: 'Highest Rated', order: 'desc' },
  { value: 'price', label: 'Price: Low to High', order: 'asc' },
  { value: 'price', label: 'Price: High to Low', order: 'desc' },
  { value: 'name', label: 'Name A-Z', order: 'asc' },
];

export const SELLER_SORT_OPTIONS = [
   { value: 'tiktokScore', label: 'default sort', order: null },
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'rating', label: 'Highest Rated', order: 'desc' },
  { value: 'rating', label: 'Lowest Rated', order: 'asc' },
  { value: 'store_name', label: 'Name A-Z', order: 'asc' },
];

export const CATEGORY_ICONS = {
  'Electronics': '💻',
  'Fashion': '👗',
  'Books': '📚',
  'Food & Beverages': '🍜',
  'Health & Beauty': '✨',
  'Sports': '⚽',
  'Home & Living': '🏠',
  'Services': '🛠️',
  'Art & Crafts': '🎨',
  'Other': '📦',
  'All': '🏪',
};
