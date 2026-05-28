import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Key, Clock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import SellerLayout from '../../components/seller/SellerLayout';
import { useSellerAuth } from '../../context/SellerAuthContext';
import axios from 'axios';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { seller } = useSellerAuth();
  const [stats, setStats]   = useState({ total: 0, active: 0 });
  const [tokenStatus, setTokenStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lens_seller_token');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('https://lens-university-market-place-alpha.vercel.app/api/seller/products', { headers: h }),
      axios.get('https://lens-university-market-place-alpha.vercel.app/api/seller/token-status', { headers: h })
    ]).then(([pRes, tRes]) => {
      const products = pRes.data.products || [];
      const now = new Date();
      setStats({
        total:  pRes.data?.total,
        active: products.filter(p => !p.expires_at || new Date(p.expires_at) > now).length
      });
      setTokenStatus(tRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatExpiry = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h left`;
    return `${h}h ${m}m left`;
  };

  return (
    <SellerLayout title="Dashboard">
      <div className="seller-dash fade-up">

        {/* Approval warning */}
        {seller && !seller.isApproved && (
          <div className="dash-alert dash-alert-warn">
            <AlertCircle size={18} />
            <div>
              <strong>Awaiting Admin Approval</strong>
              <p>Your account is under review. You can set up your store but cannot post products until approved.</p>
            </div>
          </div>
        )}

        {seller?.isApproved && (
          <div className="dash-alert dash-alert-ok">
            <CheckCircle size={18} />
            <p>Your account is <strong>approved</strong>. You can post products and redeem tokens.</p>
          </div>
        )}

        {/* Stats */}
        <div className="seller-stats-grid">
          <div className="seller-stat-card">
            <div className="seller-stat-icon"><Package size={22} /></div>
            <div>
              <p className="seller-stat-num">{loading ? '—' : stats.total}</p>
              <p className="seller-stat-label">Total Products</p>
            </div>
          </div>
          <div className="seller-stat-card">
            <div className="seller-stat-icon active"><Package size={22} /></div>
            <div>
              <p className="seller-stat-num">{loading ? '—' : stats.active}</p>
              <p className="seller-stat-label">Active / Visible</p>
            </div>
          </div>
          <div className="seller-stat-card">
            <div className="seller-stat-icon token"><Key size={22} /></div>
            <div>
              <p className="seller-stat-num" style={{ fontSize: '1rem' }}>
                {loading ? '—' : tokenStatus?.has_active_token
                  ? formatExpiry(tokenStatus.expires_at)
                  : 'No Token'}
              </p>
              <p className="seller-stat-label">Token Status</p>
            </div>
          </div>
        </div>

        {/* Token banner */}
        {!loading && !tokenStatus?.has_active_token && seller?.isApproved && (
          <div className="dash-token-banner">
            <Key size={20} />
            <div>
              <strong>No active token</strong>
              <p>Your products won't show on the marketplace until you redeem a token from the admin. Get a token and redeem it to set your listing duration.</p>
            </div>
            <Link to="/seller/token" className="btn btn-gold btn-sm">
              Redeem Token <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="dash-quick-links">
          <Link to="/seller/products" className="quick-link-card">
            <Package size={24} />
            <div>
              <h3>My Products</h3>
              <p>Add, edit and manage your listings</p>
            </div>
            <ArrowRight size={16} className="quick-link-arrow" />
          </Link>
          <Link to="/seller/token" className="quick-link-card">
            <Key size={24} />
            <div>
              <h3>Redeem Token</h3>
              <p>Enter your admin token to activate listings</p>
            </div>
            <ArrowRight size={16} className="quick-link-arrow" />
          </Link>
          <Link to="/seller/profile" className="quick-link-card">
            <Clock size={24} />
            <div>
              <h3>Edit Profile</h3>
              <p>Update store info, WhatsApp, images</p>
            </div>
            <ArrowRight size={16} className="quick-link-arrow" />
          </Link>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;
