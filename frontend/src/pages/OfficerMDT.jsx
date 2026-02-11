import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, FileText, Users, Activity, FileWarning, Database, Phone } from 'lucide-react';
import DatabaseSearch from '../components/DatabaseSearch';
import CitationForm from '../components/CitationForm';
import ReportWriter from '../components/ReportWriter';
import AITools from '../components/AITools';
import ActiveCalls from '../components/ActiveCalls';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OfficerMDT({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('calls');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'calls', label: 'Active Calls', icon: Phone },
    { id: 'search', label: 'Database Search', icon: Search },
    { id: 'citation', label: 'Citations', icon: FileWarning },
    { id: 'report', label: 'Reports', icon: FileText },
    { id: 'ai', label: 'AI Tools', icon: Activity },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1a1d24', padding: '10px' }}>
      <div className="window" style={{ minHeight: 'calc(100vh - 20px)' }}>
        {/* Title Bar */}
        <div className="title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database className="w-4 h-4" />
            <span>Law Enforcement Records Management System v2.5</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="win-button" style={{ padding: '2px 12px' }}>_</button>
            <button className="win-button" style={{ padding: '2px 12px' }}>□</button>
            <button className="win-button" onClick={onLogout} style={{ padding: '2px 12px' }}>✕</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="menu-bar">
          <div className="menu-item">File</div>
          <div className="menu-item">Edit</div>
          <div className="menu-item">View</div>
          <div className="menu-item">Tools</div>
          <div className="menu-item">Help</div>
          <button 
            onClick={onLogout}
            className="win-button btn-danger"
            style={{ 
              marginLeft: 'auto', 
              marginRight: '8px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            🚪 LOGOUT
          </button>
        </div>

        {/* Officer Info Bar */}
        <div style={{ background: '#f0f0f0', padding: '8px 12px', borderBottom: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
            <span><strong>OFFICER:</strong> {user.full_name}</span>
            <span><strong>BADGE:</strong> {user.badge_number}</span>
            <span><strong>RANK:</strong> {user.rank}</span>
            <span><strong>DEPT:</strong> {user.department}</span>
          </div>
          <div className="mono-field">
            {currentTime.toLocaleString()}
          </div>
        </div>

        {/* Tabs */}
        <div className="win-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className={`win-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ padding: '12px', background: '#111418', minHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {activeTab === 'calls' && <ActiveCalls token={token} user={user} />}
          {activeTab === 'search' && <DatabaseSearch token={token} user={user} />}
          {activeTab === 'citation' && <CitationForm token={token} user={user} />}
          {activeTab === 'report' && <ReportWriter token={token} user={user} />}
          {activeTab === 'ai' && <AITools token={token} user={user} />}
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div>System Status: ONLINE</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div className="status-section">Database: CONNECTED</div>
            <div className="status-section">AI: ENABLED</div>
            <div className="status-section mono-field">{user.username.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
