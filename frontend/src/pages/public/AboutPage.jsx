import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Star, Shield, ArrowRight, BookOpen, Zap, Heart } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import './AboutPage.css';

const values = [
  {
    icon: <Shield size={24} />,
    title: 'Trusted & Verified',
    desc: 'Every seller on our platform is reviewed and approved by the Lens University admin team before going live.'
  },
  {
    icon: <Zap size={24} />,
    title: 'Fast & Simple',
    desc: 'No complicated sign-ups for buyers. Browse, discover, and connect with sellers in seconds.'
  },
  {
    icon: <Heart size={24} />,
    title: 'Community First',
    desc: 'We exist to strengthen the campus economy — supporting student entrepreneurs and local vendors.'
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Campus Focused',
    desc: 'Built specifically for Lens University — every product and seller is relevant to campus life.'
  }
];

const team = [
  { name: 'Admin Office', role: 'Platform Management', initial: 'A' },
  { name: 'Student Council', role: 'Community Liaison', initial: 'S' },
  { name: 'ICT Department', role: 'Technical Support', initial: 'I' },
];

const AboutPage = () => (
  <>
    <Navbar />

    {/* Hero */}
    <section className="about-hero page-header">
      <div className="container">
        <p className="section-eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>Our Story</p>
        <h1 className="about-hero-title">About Lens University Market</h1>
        <p className="about-hero-sub">
          A campus marketplace built to connect buyers and sellers within the Lens University community — making trade simpler, safer, and more accessible for everyone.
        </p>
      </div>
    </section>

    {/* Mission */}
    <section className="about-mission">
      <div className="container about-mission-inner">
        <div className="about-mission-text">
          <p className="section-eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Our Mission</p>
          <h2>Empowering the Campus Economy</h2>
          <p>
            Lens University Market was created to give students, staff, and local vendors a dedicated space to trade — without the noise and distrust of general social media marketplaces.
          </p>
          <p>
            Whether you're a student selling handmade goods, a vendor offering food services, or a technician providing repairs — this platform was designed for you.
          </p>
          <Link to="/become-a-seller" className="btn btn-gold" style={{ marginTop: '1rem' }}>
            Become a Seller <ArrowRight size={16} />
          </Link>
        </div>
        <div className="about-mission-stats">
          <div className="about-stat-card">
            <ShoppingBag size={28} />
            <span className="about-stat-num">100+</span>
            <span className="about-stat-label">Products Listed</span>
          </div>
          <div className="about-stat-card">
            <Users size={28} />
            <span className="about-stat-num">50+</span>
            <span className="about-stat-label">Active Sellers</span>
          </div>
          <div className="about-stat-card">
            <Star size={28} />
            <span className="about-stat-num">4.8</span>
            <span className="about-stat-label">Avg. Seller Rating</span>
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="about-values">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p className="section-eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>What We Stand For</p>
          <h2 className="section-title">Our Values</h2>
        </div>
        <div className="grid-4">
          {values.map((v, i) => (
            <div key={i} className="value-card fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="value-icon">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="about-team">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="section-eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Behind the Platform</p>
          <h2 className="section-title">Who Runs This</h2>
        </div>
        <div className="team-grid">
          {team.map((t, i) => (
            <div key={i} className="team-card">
              <div className="team-avatar">{t.initial}</div>
              <h3>{t.name}</h3>
              <p>{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="about-cta">
      <div className="container about-cta-inner">
        <div>
          <h2>Ready to explore the marketplace?</h2>
          <p>Browse products and discover sellers on campus today.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-gold btn-lg">Browse Products <ArrowRight size={16} /></Link>
          <Link to="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--white)' }}>Contact Us</Link>
        </div>
      </div>
    </section>

    <Footer />
  </>
);

export default AboutPage;
