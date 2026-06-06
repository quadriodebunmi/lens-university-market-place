import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <div className="footer-brand">
        <div className="footer-logo">
          <ShoppingBag size={18} />
          <span>Lens University Market</span>
        </div>
        <p>Your campus marketplace — connecting students, faculty, and local sellers.</p>
      </div>
      <div className="footer-links">
        <div>
          <h4>Browse</h4>
          <Link to="/sellers">Sellers</Link>
          <Link to="/products">Products</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/become-a-seller">Become a Seller</Link>
          <Link to="/developer">Developer</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/seller/login">Seller Login</Link>
          <Link to="/seller/register">Seller Register</Link>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <div className="container">
        <p>© {new Date().getFullYear()} Lens University. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
