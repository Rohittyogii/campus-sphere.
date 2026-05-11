import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Briefcase,
  BookOpen,
  MessageSquare,
  Search,
  CheckCircle2,
  ArrowRight,
  PieChart,
  Code,
  Award,
  Zap,
  Sparkles,
  Users,
  ExternalLink,
  X,
  Globe,
  Send
} from 'lucide-react';
import api from '../../services/api';
import ReactMarkdown from 'react-markdown';
import './Placement.css';

const Placement = ({ profile }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [careerRecs, setCareerRecs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchCompany, setSearchCompany] = useState('');
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillResources, setSkillResources] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Placement Mentor. Ask me about interview prep, skill building, or career paths.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/placement/dashboard/${profile.roll_no}`);
      setDashboardData(res.data);

      const skillsRes = await api.get(`/placement/recommend-skills/${profile.roll_no}`);
      setRecommendedSkills(skillsRes.data);

      const careerRes = await api.get(`/placement/recommend-career/${profile.roll_no}`);
      setCareerRecs(careerRes.data);
    } catch (err) {
      console.error("Error fetching placement data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySearch = async (e) => {
    e.preventDefault();
    if (!searchCompany.trim()) return;
    try {
      const res = await api.get(`/placement/company-questions/${searchCompany}`);
      setCompanyQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/placement/chatbot', { query: userMsg });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleViewRoadmap = async (career) => {
    setActiveTab('chat');
    const query = `Can you provide a detailed step-by-step career roadmap for becoming a ${career}? Please include key skills to learn, milestones, and specific resources or projects I should focus on.`;

    setChatMessages(prev => [...prev, { role: 'user', content: `Show me a roadmap for ${career}` }]);
    setIsTyping(true);

    try {
      const res = await api.post('/placement/chatbot', { query: query });
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error generating the roadmap. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const fetchResources = async (skill) => {
    try {
      setSelectedSkill(skill);
      setShowResourceModal(true);
      setSkillResources([]); // Clear previous
      const res = await api.get(`/placement/resources/${skill}`);
      setSkillResources(res.data);
    } catch (err) {
      console.error("Error fetching resources", err);
    }
  };

  if (loading) return <div className="loading-state">Analyzing placement readiness...</div>;

  return (
    <div className="placement-container fade-in">
      {/* ─── Module Tabs ────────────────────────────────────────────── */}
      <div className="placement-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={18} /> Dashboard
        </button>
        <button
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          <Code size={18} /> Skill Tracker
        </button>
        <button
          className={activeTab === 'career' ? 'active' : ''}
          onClick={() => setActiveTab('career')}
        >
          <Target size={18} /> Career Path
        </button>
        <button
          className={activeTab === 'preparation' ? 'active' : ''}
          onClick={() => setActiveTab('preparation')}
        >
          <Briefcase size={18} /> Company Prep
        </button>
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          <Sparkles size={18} /> AI Mentor
        </button>
      </div>

      <div className="placement-content">
        {activeTab === 'dashboard' && (
          <div className="tab-pane">
            <div className="placement-stats-grid">
              <div className="stat-card premium-card">
                <div className="stat-icon readiness"><Zap size={24} /></div>
                <div className="stat-info">
                  <h3>Readiness Score</h3>
                  <div className="score-display">
                    <span className="score-value">{dashboardData?.readiness_score || 0}</span>
                    <span className="score-total">/ 100</span>
                  </div>
                  <div className="score-progress">
                    <div className="progress-bar" style={{ width: `${dashboardData?.readiness_score || 0}%` }} />
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon skills"><Award size={24} /></div>
                <div className="stat-info">
                  <h3>Identified Skills</h3>
                  <p className="stat-value">{dashboardData?.skills?.length || 0}</p>
                  <p className="stat-label">Core Competencies</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon matches"><Users size={24} /></div>
                <div className="stat-info">
                  <h3>Eligible Companies</h3>
                  <p className="stat-value">12</p>
                  <p className="stat-label">Based on CGPA & Skills</p>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="section-main">
                <div className="glass-card">
                  <div className="card-header">
                    <PieChart size={20} />
                    <h2>Readiness Breakdown</h2>
                  </div>
                  <div className="readiness-list">
                    <div className="readiness-item">
                      <span>Academic Performance (GPA)</span>
                      <div className="item-status success"><CheckCircle2 size={16} /> Optimal</div>
                    </div>
                    <div className="readiness-item">
                      <span>Technical Proficiency</span>
                      <div className="item-status warning">Needs Polish</div>
                    </div>
                    <div className="readiness-item">
                      <span>Soft Skills & Comm</span>
                      <div className="item-status success">Strong</div>
                    </div>
                    <div className="readiness-item">
                      <span>Project Portfolio</span>
                      <div className="item-status danger">Missing Data</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="section-side">
                <div className="glass-card">
                  <div className="card-header">
                    <Zap size={20} />
                    <h2>Quick Actions</h2>
                  </div>
                  <div className="action-btns">
                    <button className="action-btn">Update Portfolio</button>
                    <button className="action-btn secondary">Mock Interview</button>
                    <button className="action-btn secondary">Resume Review</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="tab-pane">
            <div className="skills-layout">
              <div className="current-skills">
                <h2>Your Skill Matrix</h2>
                <div className="skill-tags">
                  {dashboardData?.skills?.map((s, i) => (
                    <span key={i} className="skill-tag">{s}</span>
                  ))}
                </div>
              </div>
              <div className="recommended-skills">
                <h2>Recommended to Learn</h2>
                <p className="section-desc">Based on your career objective: <strong>{profile.career_objective}</strong></p>
                <div className="recommendation-grid">
                  {recommendedSkills.map((rs, i) => (
                    <div key={i} className="rec-skill-card">
                      <div className="rec-header">
                        <h3>{rs.skill}</h3>
                        <span className="relevance">{rs.relevance}% Match</span>
                      </div>
                      <p className="source">Needed for: {rs.source}</p>
                      <button
                        className="learn-btn"
                        onClick={() => fetchResources(rs.skill)}
                      >
                        Find Resources <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="tab-pane">
            <div className="career-recommendations">
              <h2>Top Career Pathways</h2>
              <div className="career-grid">
                {careerRecs.map((cr, i) => (
                  <div key={i} className="career-card">
                    <div className="career-header">
                      <div className="career-title">
                        <h3>{cr.career_objective}</h3>
                        <span className="match-tag">{cr.relevance}% Match</span>
                      </div>
                      <div className="growth-index">
                        <TrendingUp size={14} /> Growth: {cr.growth_index}/10
                      </div>
                    </div>
                    <p className="career-desc">{cr.description}</p>
                    <div className="career-footer">
                      <button
                        className="explore-btn"
                        onClick={() => handleViewRoadmap(cr.career_objective)}
                      >
                        View Roadmap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preparation' && (
          <div className="tab-pane">
            <div className="prep-container">
              <div className="company-search-box">
                <h2>Interview Preparation</h2>
                <p>Search for a company to view previously asked questions and resources.</p>
                <form onSubmit={handleCompanySearch} className="search-form">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="e.g. Google, Airtel, EY..."
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                  />
                  <button type="submit">Search</button>
                </form>
              </div>

              {companyQuestions.length > 0 && (
                <div className="questions-section">
                  <h3>Questions for {searchCompany}</h3>
                  <div className="questions-list">
                    {companyQuestions.map((q, i) => (
                      <div key={i} className="question-card">
                        <div className="q-meta">
                          <span className={`q-type ${q.question_type.toLowerCase()}`}>{q.question_type}</span>
                          <span className="q-role">{q.role}</span>
                        </div>
                        <p className="q-text">{q.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-pane">
            <div className="placement-chat-wrapper">
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className="bubble-content">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-bubble assistant typing">
                    <div className="typing-dots"><span></span><span></span><span></span></div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="chat-input-box">
                <input
                  type="text"
                  placeholder="Ask your mentor..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                />
                <button type="submit" disabled={isTyping || !chatInput.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ─── Resource Modal ─────────────────────────────────────────── */}
      {showResourceModal && (
        <div className="resource-modal-overlay fade-in">
          <div className="resource-modal glass-card">
            <div className="modal-header">
              <div className="header-info">
                <BookOpen size={20} color="#8b5cf6" />
                <h2>Resources for {selectedSkill}</h2>
              </div>
              <button className="close-btn" onClick={() => setShowResourceModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {skillResources.length === 0 ? (
                <div className="no-resources">
                  <p>Searching for the best learning materials...</p>
                </div>
              ) : (
                <div className="resource-list">
                  {skillResources.map((res, i) => {
                    const formattedLink = res.link.startsWith('http') ? res.link : `https://${res.link}`;
                    return (
                      <a key={i} href={formattedLink} target="_blank" rel="noopener noreferrer" className="resource-item">
                        <div className="res-info">
                          <h4>{res.platform || 'General Resource'}</h4>
                          <p>{res.skill} - {res.level} Level</p>
                          <span className="res-type">External Resource</span>
                        </div>
                        <ExternalLink size={16} className="ext-icon" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Placement;
