/**
 * Supabase Client & Data Layer
 * Handles all database operations for Products and Orders
 */

const SUPABASE_CONFIG = {
  url: 'https://hxdbiqmfpcicrgnsodsx.supabase.co',
  anonKey: 'sb_publishable_jVDtFayiWLZO5A7LNPvf2g_abdamB9Z'
};

// Check if Supabase JS SDK is loaded
let dbClient = null;
if (window.supabase) {
  try {
    dbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase Client Initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('⚠️ Supabase JS SDK not detected on window. Ensure CDN script tag is included.');
}

// Fallback demo products in case database is freshly created & empty
const SAMPLE_PRODUCTS = [
  {
    company_name: 'Apple',
    product_name: 'iPhone 16 Pro Max 256GB Titanium',
    img_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    rating: '5',
    disc: 12,
    amount: 144900,
    is_avalaible: true
  },
  {
    company_name: 'Sony',
    product_name: 'WH-1000XM5 Wireless Noise Cancelling Headphones',
    img_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    rating: '4.9',
    disc: 15,
    amount: 29990,
    is_avalaible: true
  },
  {
    company_name: 'Samsung',
    product_name: 'Galaxy Watch Ultra 47mm LTE Titanium',
    img_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    rating: '4.8',
    disc: 20,
    amount: 59999,
    is_avalaible: true
  },
  {
    company_name: 'Nike',
    product_name: 'Air Jordan 1 High OG Retro Chicago',
    img_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    rating: '5',
    disc: 10,
    amount: 16995,
    is_avalaible: true
  },
  {
    company_name: 'Bose',
    product_name: 'SoundLink Revolve+ II Bluetooth Speaker',
    img_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    rating: '4.7',
    disc: 0,
    amount: 24500,
    is_avalaible: true
  },
  {
    company_name: 'Fujifilm',
    product_name: 'X100VI Digital Camera Silver Edition',
    img_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    rating: '5',
    disc: 5,
    amount: 179999,
    is_avalaible: false
  }
];

// Helper to check RLS error
function parseSupabaseError(error) {
  if (!error) return null;
  const isRls = error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security'));
  return {
    ...error,
    isRlsError: isRls,
    userFriendlyMessage: isRls
      ? 'Row Level Security (RLS) is blocking this action. Please execute the SQL policy in setup-guide.sql in your Supabase dashboard.'
      : error.message || 'An error occurred with Supabase.'
  };
}

/**
 * Product Database Operations
 */
const ProductService = {
  // Fetch all products from Supabase
  async getAll() {
    if (!dbClient) throw new Error('Database client not initialized');
    
    const { data, error } = await dbClient
      .from('product')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      throw parseSupabaseError(error);
    }
    return data || [];
  },

  // Fetch product by ID
  async getById(id) {
    if (!dbClient) throw new Error('Database client not initialized');
    
    const { data, error } = await dbClient
      .from('product')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data;
  },

  // Create new product
  async create(product) {
    if (!dbClient) throw new Error('Database client not initialized');
    
    const payload = {
      company_name: product.company_name.trim(),
      product_name: product.product_name.trim(),
      img_url: product.img_url ? product.img_url.trim() : '',
      rating: product.rating ? String(product.rating) : '5',
      disc: product.disc ? parseInt(product.disc, 10) : 0,
      amount: parseInt(product.amount, 10),
      is_avalaible: product.is_avalaible === undefined ? true : Boolean(product.is_avalaible)
    };

    const { data, error } = await dbClient
      .from('product')
      .insert([payload])
      .select();

    if (error) throw parseSupabaseError(error);
    return data && data[0];
  },

  // Update product fields (e.g. img_url, amount, is_avalaible)
  async update(id, updates) {
    if (!dbClient) throw new Error('Database client not initialized');

    const { data, error } = await dbClient
      .from('product')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw parseSupabaseError(error);
    return data && data[0];
  },

  // Update image URL specifically (quick action)
  async updateImageUrl(id, newUrl) {
    return this.update(id, { img_url: newUrl.trim() });
  },

  // Delete product
  async delete(id) {
    if (!dbClient) throw new Error('Database client not initialized');

    const { error } = await dbClient
      .from('product')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return true;
  },

  // Seed sample products into database
  async seedDemoData() {
    if (!dbClient) throw new Error('Database client not initialized');

    const { data, error } = await dbClient
      .from('product')
      .insert(SAMPLE_PRODUCTS)
      .select();

    if (error) throw parseSupabaseError(error);
    return data;
  }
};

/**
 * Order Database Operations
 */
const OrderService = {
  // Fetch all orders
  async getAll() {
    if (!dbClient) throw new Error('Database client not initialized');

    // In user schema, order_table has product_id foreign key
    const { data, error } = await dbClient
      .from('order_table')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return data || [];
  },

  // Place a new order
  async create(order) {
    if (!dbClient) throw new Error('Database client not initialized');

    const payload = {
      product_id: parseInt(order.product_id, 10),
      user_name: order.user_name.trim(),
      address: order.address.trim(),
      number: order.number ? parseInt(order.number, 10) : null
    };

    const { data, error } = await dbClient
      .from('order_table')
      .insert([payload])
      .select();

    if (error) throw parseSupabaseError(error);
    return data && data[0];
  },

  // Delete an order (admin management)
  async delete(productId) {
    if (!dbClient) throw new Error('Database client not initialized');

    const { error } = await dbClient
      .from('order_table')
      .delete()
      .eq('product_id', productId);

    if (error) throw parseSupabaseError(error);
    return true;
  }
};

/**
 * Local Shopping Cart Manager
 */
const CartService = {
  STORAGE_KEY: 'lumen_ecommerce_cart',

  getItems() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  saveItems(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  },

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => i.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: product.id,
        product_name: product.product_name,
        company_name: product.company_name,
        img_url: product.img_url,
        amount: product.amount,
        disc: product.disc || 0,
        quantity: quantity
      });
    }

    this.saveItems(items);
    return items;
  },

  updateQuantity(productId, quantity) {
    let items = this.getItems();
    if (quantity <= 0) {
      items = items.filter(i => i.id !== productId);
    } else {
      const item = items.find(i => i.id === productId);
      if (item) item.quantity = quantity;
    }
    this.saveItems(items);
    return items;
  },

  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(i => i.id !== productId);
    this.saveItems(items);
    return items;
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } }));
  },

  getTotal() {
    const items = this.getItems();
    return items.reduce((acc, item) => {
      const price = item.disc > 0 
        ? item.amount - (item.amount * (item.disc / 100))
        : item.amount;
      return acc + (price * item.quantity);
    }, 0);
  },

  getCount() {
    const items = this.getItems();
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }
};

// UI Toast Notification Helper
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', title = '') {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || '•'}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

// Export services onto window for clean, modular script usage
window.ProductService = ProductService;
window.OrderService = OrderService;
window.CartService = CartService;
window.Toast = Toast;
window.SAMPLE_PRODUCTS = SAMPLE_PRODUCTS;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
