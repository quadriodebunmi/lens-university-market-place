import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Store } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const close = () => setOpen(false);

  const links = [
    { to: '/',        label: 'Home' },
    { to: '/sellers', label: 'Sellers' },
    { to: '/products',label: 'Products' },
    { to: '/about',   label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/developer', label: 'Developer' },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close}>
          <ShoppingBag size={20} />
          <span className="brand-text">
            <span className="brand-lens">Lens</span>
            <span className="brand-uni">University</span>
          </span>
          <span className="brand-sub">Market</span>
        </Link>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`nav-link ${loc.pathname === l.to ? 'active' : ''}`}
              onClick={close}>
              {l.label}
            </Link>
          ))}
          <Link to="/become-a-seller" className="btn btn-outline btn-sm" onClick={close}>
            <Store size={14} /> Sell Here
          </Link>
          <Link to="/seller/login" className="btn btn-outline btn-sm" onClick={close}>
            Seller Login
          </Link>

        </div>

        <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      
    </nav>
  );
};

export default Navbar;
