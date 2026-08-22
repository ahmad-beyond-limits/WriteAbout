'use client'; // Force hot-reload

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type AnalysisResult = {
  wordCount: number;
  rate: string;
  feedback: string;
} | null;

const RATE_COLORS = {
  'low': '#ef4444',
  'medium': '#f59e0b',
  'good': '#3b82f6',
  'high': '#8b5cf6',
  'excellent': '#10b981'
};

function InsightsScreen({ onPractice, onLogout, userId }: { onPractice: () => void, onLogout: () => void, userId: number }) {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'week' | 'month'>('week');
  const [reviewItem, setReviewItem] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/insights?filter=${filter}&userId=${userId}`).then(r => r.json()).then(d => {
      if (d.success) setData(d);
    });
  }, [filter, userId]);

  if (!data) return (
    <div className="auth-container">
      <div className="auth-card" style={{textAlign: 'center', color: '#666'}}>
        Loading your insights from Postgres...
      </div>
    </div>
  );

  return (
    <div className="insights-wrapper">
       <nav className="top-nav" style={{justifyContent: 'space-between', padding: '1.5rem 3rem'}}>
         <div className="nav-title">Your Insights</div>
         <div style={{display: 'flex', gap: '1rem'}}>
           <button className="btn-outline" onClick={onLogout} style={{padding: '10px 24px'}}>Logout</button>
           <button className="btn-black" onClick={onPractice} style={{padding: '10px 24px'}}>Start Practicing</button>
         </div>
       </nav>

       <div className="insights-content">
         <div className="dashboard-grid">
            {/* API Limits */}
            <div className="dash-card limits-card">
              <h3 className="dash-title">API Limits</h3>
              <ul className="limits-list" style={{ gap: '8px' }}>
                <li style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '2px' }}>Requests</li>
                <li><span className="limit-val" style={{ width: '60px' }}>30</span> / minute</li>
                <li><span className="limit-val" style={{ width: '60px' }}>1K</span> / day</li>
                <li style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px', marginBottom: '2px' }}>Tokens</li>
                <li><span className="limit-val" style={{ width: '60px' }}>8K</span> / minute</li>
                <li><span className="limit-val" style={{ width: '60px' }}>200K</span> / day</li>
              </ul>
            </div>

           {/* API Usage */}
           <div className="dash-card">
             <h3 className="dash-title">API Usage (Last 7 Days)</h3>
             <ResponsiveContainer width="100%" height={180}>
               <BarChart data={data.apiUsage}>
                 <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                 <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="calls" fill="#111" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>

           {/* Performance */}
           <div className="dash-card">
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
               <h3 className="dash-title" style={{margin: 0}}>Performance Breakdown</h3>
               <div className="filter-toggle">
                 <button className={`filter-btn ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>Week</button>
                 <button className={`filter-btn ${filter === 'month' ? 'active' : ''}`} onClick={() => setFilter('month')}>Month</button>
               </div>
             </div>
             <ResponsiveContainer width="100%" height={180}>
               <BarChart data={data.performance}>
                 <XAxis dataKey="name" tick={{fontSize: 12}} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} tickLine={false} axisLine={false} />
                 <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                   {data.performance.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={RATE_COLORS[entry.name as keyof typeof RATE_COLORS] || '#111'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="history-section">
           <h3 className="dash-title" style={{marginBottom: '1rem'}}>Recent Practices</h3>
           <div className="history-list">
             {data.history.length === 0 ? (
               <div className="empty-state">No practices recorded yet.</div>
             ) : (
               data.history.map((item: any) => (
                 <div key={item.id} className="history-card">
                   <div className="history-header">
                     <span className="history-id">Practice #{item.id}</span>
                     <span className="history-rate" style={{
                       backgroundColor: RATE_COLORS[item.rate as keyof typeof RATE_COLORS] + '20',
                       color: RATE_COLORS[item.rate as keyof typeof RATE_COLORS]
                     }}>{item.rate}</span>
                   </div>
                   <p className="history-feedback">{item.feedback}</p>
                   <div className="history-date">{item.date}</div>
                   <div className="history-actions">
                     <button className="btn-small-outline" onClick={() => setReviewItem(item)}>Review Feedback</button>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
        </div>

        {/* Review Modal */}
        <div className={`analysis-overlay ${reviewItem !== null ? 'active' : ''}`}>
          {reviewItem && (
            <div className="analysis-card slide-up">
              <h2 className="analysis-title">Practice #{reviewItem.id}</h2>
              <div className="metric-val" style={{color: RATE_COLORS[reviewItem.rate as keyof typeof RATE_COLORS], marginBottom: '1rem'}}>{reviewItem.rate.toUpperCase()}</div>
              <p className="feedback-text">{reviewItem.feedback}</p>
              
              <div style={{display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem'}}>
                 <button className="btn-outline" style={{flex: 1}} onClick={() => setReviewItem(null)}>
                   Cancel
                 </button>
                 <button className="btn-black" style={{flex: 1}} onClick={() => {
                   onPractice();
                   // Need to trigger a special event or pass state to reload this specific image.
                   // A simple dispatch can work, or we call onPractice with the image URL.
                   window.dispatchEvent(new CustomEvent('practice-again', { detail: reviewItem.image_url }));
                 }}>
                   Practice Again
                 </button>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}

export default function Home() {
  const TOTAL_TIME = 60;
  
  const [currentView, setCurrentView] = useState<'login' | 'apikey' | 'insights' | 'practice'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  // Practice State
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);
  const [usedImageIds, setUsedImageIds] = useState<number[]>([]);

  // Session recovery on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('writeabout_user');
    const storedApiKey = localStorage.getItem('writeabout_apikey');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (storedApiKey) {
        setApiKey(storedApiKey);
        setCurrentView('insights');
      } else {
        setCurrentView('apikey');
      }
    }
  }, []);

  useEffect(() => {
    const handlePracticeAgain = (e: any) => {
      setImageUrl(e.detail);
      setText('');
      setTimeLeft(TOTAL_TIME);
      setAnalysis(null);
      setIsRunning(true);
    };
    window.addEventListener('practice-again', handlePracticeAgain);
    return () => window.removeEventListener('practice-again', handlePracticeAgain);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      submitLog();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleLoginSubmit = async () => {
    setAuthStatus('');
    if (!username.trim() || !password.trim()) {
      setAuthStatus('Username and password are required.');
      return;
    }
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('writeabout_user', JSON.stringify(data.user));
        if (data.apiKey) {
          setApiKey(data.apiKey);
          localStorage.setItem('writeabout_apikey', data.apiKey);
          setCurrentView('insights');
        } else {
          setApiKey('');
          setCurrentView('apikey');
        }
      } else {
        setAuthStatus(data.error || 'Login failed.');
      }
    } catch (e) {
      setAuthStatus('Error logging in. Check connection.');
    }
    setIsLoadingAuth(false);
  };

  const handleRegisterSubmit = async () => {
    setAuthStatus('');
    if (!username.trim() || !password.trim()) {
      setAuthStatus('Username and password are required.');
      return;
    }
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('writeabout_user', JSON.stringify(data.user));
        setApiKey('');
        setCurrentView('apikey');
      } else {
        setAuthStatus(data.error || 'Registration failed.');
      }
    } catch (e) {
      setAuthStatus('Error registering. Check connection.');
    }
    setIsLoadingAuth(false);
  };

  const handleApiKeyVerify = async () => {
    setAuthStatus('');
    if (!apiKey.trim()) {
      setAuthStatus('Please enter a Groq API key.');
      return;
    }
    setIsLoadingAuth(true);
    try {
      const verifyRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });
      if (!verifyRes.ok) {
        setAuthStatus('Invalid Groq API Key.');
        setIsLoadingAuth(false);
        return;
      }

      const saveRes = await fetch('/api/auth/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, apiKey: apiKey.trim() })
      });
      const saveData = await saveRes.json();
      if (saveRes.ok && saveData.success) {
        localStorage.setItem('writeabout_apikey', apiKey.trim());
        setCurrentView('insights');
      } else {
        setAuthStatus(saveData.error || 'Failed to save API key.');
      }
    } catch (e) {
      setAuthStatus('Error verifying API Key. Check your connection.');
    }
    setIsLoadingAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('writeabout_user');
    localStorage.removeItem('writeabout_apikey');
    setUser(null);
    setApiKey('');
    setPassword('');
    setUsername('');
    setAuthStatus('');
    setCurrentView('login');
  };

  const handleStartPractice = () => {
    setCurrentView('practice');
    
    // Pick random unique ID 1-1000
    let newId;
    do {
      newId = Math.floor(Math.random() * 1000) + 1;
    } while (usedImageIds.includes(newId));
    
    setUsedImageIds(prev => [...prev, newId]);
    setImageUrl(`https://picsum.photos/id/${newId}/800/800`);
    setText('');
    setTimeLeft(TOTAL_TIME);
    setAnalysis(null);
    setIsRunning(true);
  };

  const submitLog = async () => {
    if (text.trim().length === 0) {
      alert("Please write something to evaluate.");
      setIsRunning(false);
      setCurrentView('insights');
      return;
    }

    setIsRunning(false);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image: imageUrl, timeLeft, apiKey, userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis({ wordCount: text.split(' ').length, rate: 'low', feedback: 'Submission recorded but analysis failed.' });
      }
    } catch (e) {
      setAnalysis({ wordCount: 0, rate: 'low', feedback: 'Failed to reach server.' });
    }
    setIsSubmitting(false);
  };

  if (currentView === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="nav-title" style={{textAlign: 'center', marginBottom: '2rem'}}>WriteAbout</div>
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '18px', fontWeight: '600' }}>
            {isRegisterMode ? 'Create Account' : 'Sign In'}
          </h3>
          
          <div style={{marginBottom: '1.2rem', textAlign: 'left'}}>
            <label className="auth-label">Username</label>
            <input 
              type="text" 
              className="auth-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div style={{marginBottom: '1.5rem', textAlign: 'left'}}>
            <label className="auth-label">Password</label>
            <input 
              type="password" 
              className="auth-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {authStatus && <div className="auth-error">{authStatus}</div>}

          <button 
            className="btn-black auth-btn" 
            onClick={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} 
            disabled={isLoadingAuth}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {isLoadingAuth ? 'Please wait...' : (isRegisterMode ? 'Register' : 'Login')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"} {' '}
            <button 
              style={{ background: 'none', border: 'none', color: '#111', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthStatus('');
              }}
            >
              {isRegisterMode ? 'Sign In' : 'Register Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'apikey') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="nav-title" style={{textAlign: 'center', marginBottom: '1.5rem'}}>WriteAbout</div>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#333' }}>Welcome, {user?.username}!</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '13px', color: '#666' }}>
              Configure your Groq API Key to start practicing.
            </p>
          </div>

          <div style={{marginBottom: '2rem', textAlign: 'left'}}>
            <label className="auth-label">Groq API Key</label>
            <input 
              type="text" 
              className="auth-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
            />
            {apiKey.startsWith('gsk_') && (
              <span style={{ fontSize: '11px', color: 'green', display: 'block', marginTop: '0.3rem' }}>
                ✓ Found key saved in your secure profile
              </span>
            )}
          </div>

          {authStatus && <div className="auth-error">{authStatus}</div>}

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button 
              className="btn-outline" 
              onClick={() => {
                setUser(null);
                setApiKey('');
                setCurrentView('login');
              }}
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button 
              className="btn-black" 
              onClick={handleApiKeyVerify} 
              disabled={isLoadingAuth}
              style={{ flex: 2 }}
            >
              {isLoadingAuth ? 'Verifying...' : 'Verify & Start'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'insights') {
    return <InsightsScreen onPractice={handleStartPractice} onLogout={handleLogout} userId={user?.id || 0} />;
  }

  const isUrgent = timeLeft <= 10;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <>
      <nav className="top-nav">
        <div className={`timer-pill ${isUrgent ? 'urgent' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          {formattedTime}
        </div>
        <div className="nav-title">WriteAbout</div>
      </nav>

      <div className="main-wrapper">
        <main className="app-container">
          <div className="col-left">
            <div className="image-wrapper">
              {imageUrl && <img src={imageUrl} alt="Visual Challenge" />}
            </div>
          </div>
          <div className="col-right">
            <textarea 
              className="writing-box"
              placeholder={isRunning ? "Write your beautiful description here..." : "Click start to begin the 60-second challenge."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!isRunning || isSubmitting}
            />
          </div>
        </main>
      </div>

      <footer className="bottom-nav">
        <div className="footer-content">
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <button className="btn-outline" onClick={() => setCurrentView('insights')} style={{ padding: '10px 24px', fontSize: '14px' }}>
              Back to Insights
            </button>
            {isRunning && analysis === null && (
              <button className="btn-icon" onClick={handleStartPractice} title="Refresh Image" style={{
                background: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                transition: 'all 0.2s'
              }} onMouseOver={(e) => { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.borderColor = '#ccc'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
            )}
          </div>
          
          {!isRunning && analysis === null ? (
            <button className="btn-black" onClick={handleStartPractice}>
              Submit
            </button>
          ) : (
            <button 
              className="btn-black" 
              onClick={submitLog}
              disabled={!isRunning || isSubmitting || text.trim().length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </footer>

      {/* Analysis Slide-Up Modal Overlay */}
      <div className={`analysis-overlay ${analysis !== null ? 'active' : ''}`}>
        <div className="analysis-card slide-up">
          <h2 className="analysis-title">Performance Analysis</h2>
          
          <div className="metrics-grid">
            <div className="metric">
              <div className="metric-val">{analysis?.wordCount || 0}</div>
              <div className="metric-lbl">Words</div>
            </div>
            <div className="metric">
              <div className="metric-val" style={{color: analysis ? RATE_COLORS[analysis.rate as keyof typeof RATE_COLORS] : '#000'}}>
                {analysis?.rate?.toUpperCase() || ''}
              </div>
              <div className="metric-lbl">Rating</div>
            </div>
          </div>
          
          <p className="feedback-text">{analysis?.feedback}</p>
          
          <div style={{display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem'}}>
             <button className="btn-outline" style={{flex: 1}} onClick={() => setCurrentView('insights')}>
               Insights
             </button>
             <button className="btn-black" style={{flex: 1}} onClick={handleStartPractice}>
               Next Image
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
