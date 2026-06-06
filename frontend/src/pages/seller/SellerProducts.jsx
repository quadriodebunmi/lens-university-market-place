import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Clock , Trash2} from 'lucide-react';
import SellerLayout from '../../components/seller/SellerLayout';
import Pagination from '../../components/shared/Pagination';
import { uploadToCloudinary } from '../../utils/cloudinary';
import api from '../../utils/api';
import { CATEGORIES_NO_ALL, CATEGORY_ICONS } from '../../utils/constants';
import { useSellerAuth } from '../../context/SellerAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './SellerProducts.css';

const EMPTY = { name: '', description: '', price: '', category: 'Electronics', time_frame: '', product_image: '' };

const ProductModal = ({ product, onClose, onSaved, token }) => {
  const isEdit = !!product?._id;
  const [form, setForm] = useState(isEdit ? {
    name: product.name, description: product.description || '',
    price: product.price, category: product.category,
    time_frame: product.time_frame || '', product_image: product.product_image || ''
  } : { ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(f => ({ ...f, product_image: url }));
      toast.success('Image uploaded!');
    } catch (err) { toast.error('Upload failed: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit) {
        await axios.put(`https://lens-university-market-place-alpha.vercel.app/api/seller/products/${product._id}`, form, { headers });
        toast.success('Product updated!');
      } else {
        await axios.post('https://lens-university-market-place-alpha.vercel.app/api/seller/products', form, { headers });
        toast.success('Product posted!');
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Price (₦) *</label>
                <input type="number" className="form-control" required min="0" step="0.01"
                  value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" required value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES_NO_ALL.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Availability / Time Frame</label>
              <input className="form-control" placeholder="e.g. Mon–Fri 9am–5pm" value={form.time_frame} onChange={e => set('time_frame', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Product Image</label>
              <label className="upload-btn-wide">
                {uploading ? <span>Uploading…</span>
                  : form.product_image
                    ? <img src={form.product_image} alt="" style={{ height: 60, borderRadius: 6, objectFit: 'cover' }} />
                    : <span>+ Click to upload image</span>}
                <input type="file" accept="image/*" hidden onChange={handleImage} disabled={uploading} />
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Post Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExpiryBadge = ({ expires_at }) => {
  if (!expires_at) return <span className="expiry-none">No token set</span>;
  const diff = new Date(expires_at) - new Date();
  if (diff <= 0) return <span className="expiry-dead">Expired</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const cls = h < 1 ? 'expiry-critical' : h < 6 ? 'expiry-warn' : 'expiry-ok';
  return <span className={`expiry-tag ${cls}`}><Clock size={11} />{h > 0 ? `${h}h ` : ''}{m}m left</span>;
};

const SellerProducts = () => {
  const { seller } = useSellerAuth();
  const [deleteId, setDeleteId]   = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(null);
  const token = localStorage.getItem('lens_seller_token');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://lens-university-market-place-alpha.vercel.app/api/seller/products?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, token]);

 useEffect(() => { fetchProducts(); }, [fetchProducts]);
  
  const handleDelete = async (id) => {
    try { await api.delete(`/products/seller/${id}`); toast.success('Product deleted'); fetchProducts(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleteId(null); }
  };

  if (seller && !seller.isApproved) {
    return (
      <SellerLayout title="My Products">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Awaiting Approval</h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            Your account is pending admin approval. Once approved, you can post and manage products here.
          </p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title="My Products">
      <div className="seller-products-page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button className="btn btn-gold" onClick={() => setModal('add')}>
            <Plus size={16} /> Add Product
          </button>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Visible Until</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
                      No products yet. Click "Add Product" to get started.
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="table-seller-info">
                          <div className="table-avatar" style={{ borderRadius: 8 }}>
                            {p.product_image
                              ? <img src={p.product_image} alt={p.name} />
                              : <span>{CATEGORY_ICONS[p.category]}</span>}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</p>
                            {p.description && <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', maxWidth: 180, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{p.category}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--gold)' }}>₦{Number(p.price).toLocaleString()}</td>
                      <td><ExpiryBadge expires_at={p.expires_at} /></td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(p)}>
                            <Pencil size={13} /> Edit
                          </button>
                          
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}

        {modal && (
          <ProductModal
            product={modal === 'add' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={fetchProducts}
            token={token}
          />
        )}
        
        
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:400 }}>
            <div className="modal-header"><h3>Confirm Delete</h3></div>
            <div className="modal-body"><p style={{ fontSize:'0.9rem' }}>Delete this product permanently? </p></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SellerLayout>
  );
};

export default SellerProducts;
