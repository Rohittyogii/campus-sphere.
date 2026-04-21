import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, User, Mail, GraduationCap,
  ChevronRight, Loader2, AlertCircle,
  Info, Eye, EyeOff
} from 'lucide-react';
import api from '../services/api';
import './Login.css';
import universityLogo from '../assets/logo.png';
import login1 from '../assets/login 1.jpg';
import login2 from '../assets/login 2.jpg';
import login3 from '../assets/login 3.jpg';
import login4 from '../assets/login 4.jpg';
import login5 from '../assets/login 5.jpg';
import login6 from '../assets/login 6.jpg';
import login7 from '../assets/login 7.jpg';

const slides = [
  {
    title: "Welcome to NCU",
    desc: "Modern infrastructure and world-class facilities for excellence in education",
    image: login1
  },
  {
    title: "Serene Campus Environment",
    desc: "Beautiful green campus designed for learning and growth",
    image: login2
  },
  {
    title: "Pristine Campus Grounds",
    desc: "Lush greenery and peaceful landscapes for a perfect study environment",
    image: login3
  },
  {
    title: "Global Collaborations",
    desc: "International partnerships for world-class education",
    image: login4
  },
  {
    title: "Energetic Campus Events",
    desc: "Spectacular cultural events and entertainment for vibrant student life",
    image: login5
  },
  {
    title: "Industry-Academia Partnerships",
    desc: "Connecting students with industry leaders and future opportunities",
    image: login6
  },
  {
    title: "Experiential Learning",
    desc: "Educational tours and field visits for practical knowledge",
    image: login7
  },
  {
    title: "Vibrant Student Culture",
    desc: "Creative expression and holistic development opportunities",
    image: login1
  }
];

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    student_name: '',
    roll_no: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500); // Slide changes every 4.5 seconds
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', formData.username);
        params.append('password', formData.password);

        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', res.data.access_token);
        navigate('/');
      } else {
        const registerData = {
          email: formData.email,
          student_name: formData.student_name,
          roll_no: formData.roll_no,
          password: formData.password
        };
        const res = await api.post('/auth/register', registerData);
        localStorage.setItem('token', res.data.access_token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page fade-in"
      style={{
        backgroundImage: `url(${slides[currentSlide].image})`,
        transition: 'background-image 0.8s ease-in-out'
      }}
    >
      {/* Main Login Card */}
      <div className="login-card">
        <div className="form-header">
          <div style={{ marginBottom: '1.5rem' }}>
            <img
              src={universityLogo}
              alt="University Logo"
              style={{ height: '50px', width: 'auto' }}
            />
          </div>

          <h1>Campus Sphere</h1>
          <p className="tagline">The Complete Campus Experience</p>
        </div>

        <div className="welcome-msg" style={{ marginTop: '0.5rem' }}>
          <h2>Welcome Back</h2>
          <p>Sign in to access your portal</p>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form" style={{ marginTop: '1.5rem' }}>
          <div className="input-container">
            <label>Username (Roll No.)</label>
            <div className="input-field-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                name="username"
                placeholder="Enter your roll number"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="input-container">
            <label>Password</label>
            <div className="input-field-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <div className="form-options" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{ margin: 0 }}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Need help? <a href="#" style={{ color: 'var(--login-accent)', fontWeight: 600 }}>Contact IT Support</a>
          </p>
          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            © 2025 Campus Sphere. All rights reserved.
          </div>
        </div>
      </div>

      {/* Hero Content Overlay on the Right */}
      <div className="hero-overlay">
        <div className="hero-glass-card">
          <div className="slide-content" key={currentSlide}>
            <h3>{slides[currentSlide].title}</h3>
            <p>{slides[currentSlide].desc}</p>
          </div>

          <div className="pagination-dots">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
