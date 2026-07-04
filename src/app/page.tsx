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

function InsightsScreen({ onPractice, onLogout }: { onPractice: () => void, onLogout: () => void }) {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/insights').then(r => r.json()).then(d => {
      if (d.success) setData(d);
    });
  }, []);

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
             <ul className="limits-list">
               <li><span className="limit-val">5</span> calls per minute</li>
               <li><span className="limit-val">150</span> calls per hour</li>
               <li><span className="limit-val">2400</span> calls per day</li>
               <li><span className="limit-val">60k</span> max context length</li>
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
             <h3 className="dash-title">Performance (This Month)</h3>
             <ResponsiveContainer width="100%" height={180}>
               <PieChart>
                 <Pie data={data.performance} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                   {data.performance.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={RATE_COLORS[entry.name as keyof typeof RATE_COLORS] || '#000'} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
               </PieChart>
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
                 </div>
               ))
             )}
           </div>
         </div>
       </div>
    </div>
  )
}

export default function Home() {
  const TOTAL_TIME = 60;
  
  const [currentView, setCurrentView] = useState<'login' | 'insights' | 'practice'>('login');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Practice State
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);
  const [usedImageIds, setUsedImageIds] = useState<number[]>([]);

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

  const handleLogin = async () => {
    setAuthStatus('');
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || 'ahmad-beyond-limits-123';
    
    if (password !== correctPassword) {
      setAuthStatus('Incorrect password.');
      return;
    }
    if (!apiKey.trim()) {
      setAuthStatus('Please enter a Cerebras API key.');
      return;
    }
    
    setIsLoadingAuth(true);
    try {
      const res = await fetch('https://api.cerebras.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (res.ok) {
        setCurrentView('insights');
      } else {
        setAuthStatus('Invalid Cerebras API Key.');
      }
    } catch (e) {
      setAuthStatus('Error verifying API Key. Check your connection.');
    }
    setIsLoadingAuth(false);
  };

  const handleLogout = () => {
    setCurrentView('login');
    setPassword('');
    setAuthStatus('');
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
    setIsRunning(false);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image: imageUrl, timeLeft, apiKey }),
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

          <div style={{marginBottom: '2rem', textAlign: 'left'}}>
            <label className="auth-label">Cerebras API Key</label>
            <input 
              type="text" 
              className="auth-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          {authStatus && <div className="auth-error">{authStatus}</div>}

          <button className="btn-black auth-btn" onClick={handleLogin} disabled={isLoadingAuth}>
            {isLoadingAuth ? 'Verifying...' : 'Start'}
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'insights') {
    return <InsightsScreen onPractice={handleStartPractice} onLogout={handleLogout} />;
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
          <button className="btn-outline" onClick={() => setCurrentView('insights')} style={{ padding: '10px 24px', fontSize: '14px' }}>
            Back to Insights
          </button>
          
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
