import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Zap, Shield, Brain, Radio, MapPin, Users, ChevronRight, Play, AlertCircle, Clock, CheckCircle, Mic, Volume2, Smartphone, Wifi, MessageSquare } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeCalls, setActiveCalls] = useState([]);
  const [conversationStep, setConversationStep] = useState(0);
  const [radioStep, setRadioStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const demoCallsData = [
      { id: 1, type: 'Medical', location: '1247 Oak Street', description: 'Chest pain, 67-year-old male', priority: 1, status: 'Active', time: '14:23:15' },
      { id: 2, type: 'Fire', location: '892 Maple Avenue', description: 'Structure fire, smoke visible', priority: 1, status: 'Dispatched', time: '14:21:42' },
      { id: 3, type: 'Police', location: '3401 Pine Boulevard', description: 'Traffic accident with injuries', priority: 2, status: 'Active', time: '14:19:08' }
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < demoCallsData.length) {
        setActiveCalls(prev => [demoCallsData[currentIndex], ...prev]);
        currentIndex++;
      } else {
        setTimeout(() => { setActiveCalls([]); currentIndex = 0; }, 3000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const steps = [
      { speaker: 'ai', text: '911, what\'s your emergency?', duration: 2000 },
      { speaker: 'caller', text: 'There\'s a fire at 892 Maple Avenue!', duration: 2500 },
      { speaker: 'ai', text: 'I understand. Are you in a safe location right now?', duration: 2500 },
      { speaker: 'caller', text: 'Yes, I\'m across the street. Smoke is coming from the roof.', duration: 3000 },
      { speaker: 'ai', text: 'Copy. Fire units dispatched to 892 Maple. Stay clear of the structure.', duration: 2500 }
    ];
    let current = 0;
    let timeout;
    const advance = () => {
      if (current < steps.length) {
        setConversationStep(current);
        timeout = setTimeout(() => { current++; advance(); }, steps[current].duration);
      } else {
        timeout = setTimeout(() => { setConversationStep(0); current = 0; advance(); }, 3000);
      }
    };
    advance();
    return () => clearTimeout(timeout);
  }, []);

  // Officer radio conversation demo
  useEffect(() => {
    const steps = [
      { speaker: 'dispatch', text: '🔊 *squelch* ADAM-12, 10-52. Structure fire, 892 Maple Avenue. Engine-1 en route. Respond code 3.', duration: 4000 },
      { speaker: 'officer', text: '10-4 dispatch, ADAM-12 responding to 892 Maple. Show me 10-76.', duration: 3000 },
      { speaker: 'dispatch', text: 'Copy ADAM-12. 10-76 at 14:24. Caller reports smoke from roof. No injuries reported.', duration: 3500 },
      { speaker: 'officer', text: 'ADAM-12 10-97, 892 Maple. Heavy smoke visible. Request additional units.', duration: 3000 },
      { speaker: 'dispatch', text: '10-4 ADAM-12. Engine-5 and Medic-1 dispatched to your location. ETA 4 minutes.', duration: 3000 }
    ];
    let current = 0;
    let timeout;
    const advance = () => {
      if (current < steps.length) {
        setRadioStep(current);
        timeout = setTimeout(() => { current++; advance(); }, steps[current].duration);
      } else {
        timeout = setTimeout(() => { setRadioStep(0); current = 0; advance(); }, 3000);
      }
    };
    advance();
    return () => clearTimeout(timeout);
  }, []);

  const conversationSteps = [
    { speaker: 'ai', text: '911, what\'s your emergency?', duration: 2000 },
    { speaker: 'caller', text: 'There\'s a fire at 892 Maple Avenue!', duration: 2500 },
    { speaker: 'ai', text: 'I understand. Are you in a safe location right now?', duration: 2500 },
    { speaker: 'caller', text: 'Yes, I\'m across the street. Smoke is coming from the roof.', duration: 3000 },
    { speaker: 'ai', text: 'Copy. Fire units dispatched to 892 Maple. Stay clear of the structure.', duration: 2500 }
  ];

  const radioSteps = [
    { speaker: 'dispatch', text: '🔊 *squelch* ADAM-12, 10-52. Structure fire, 892 Maple Avenue. Engine-1 en route. Respond code 3.' },
    { speaker: 'officer', text: '10-4 dispatch, ADAM-12 responding to 892 Maple. Show me 10-76.' },
    { speaker: 'dispatch', text: 'Copy ADAM-12. 10-76 at 14:24. Caller reports smoke from roof. No injuries reported.' },
    { speaker: 'officer', text: 'ADAM-12 10-97, 892 Maple. Heavy smoke visible. Request additional units.' },
    { speaker: 'dispatch', text: '10-4 ADAM-12. Engine-5 and Medic-1 dispatched to your location. ETA 4 minutes.' }
  ];

  const stats = [
    { value: "<500ms", label: "Voice Latency" },
    { value: "24/7", label: "AI Availability" },
    { value: "Real-time", label: "Radio Dispatch" },
    { value: "10-Code", label: "Radio Protocol" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.5}px)`
        }} />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-20 pb-32">
          <nav className="flex justify-between items-center mb-20">
            <div className="flex items-center space-x-3">
              <Shield className="w-10 h-10 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Patriot CAD
              </span>
            </div>
            <button onClick={() => navigate('/login')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 transform hover:scale-105">
              Sign In
            </button>
          </nav>

          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-blue-400 text-sm font-semibold">Powered by OpenAI Realtime API</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              AI 911 Dispatcher
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                + Officer Radio App
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              A fully AI-powered emergency dispatch system. Callers talk to an AI 911 dispatcher. 
              Officers get real-time dispatch alerts on their mobile radio app with PTT voice commands, 
              10-codes, and database lookups — all powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button onClick={() => window.open('tel:+18704992134')} className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg shadow-blue-500/50">
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Call the AI Dispatcher</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/login')} className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-300 flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span className="font-semibold">View CAD Dashboard</span>
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Call <span className="text-blue-400 font-mono">+1 (870) 499-2134</span> to talk to the AI dispatcher live
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* === THE FULL FLOW SECTION === */}
      <div className="relative py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                End-to-End <span className="text-blue-400">AI Dispatch</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Caller talks to AI → AI creates CAD entry → Dispatch alert hits officer's radio app → Officer responds via PTT
              </p>
            </div>

            {/* Three-panel flow */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Panel 1: AI 911 Call */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-red-500/20 rounded-lg"><Phone className="w-5 h-5 text-red-400" /></div>
                  <div>
                    <h3 className="text-lg font-bold">1. AI 911 Dispatcher</h3>
                    <p className="text-xs text-gray-500">Caller ↔ OpenAI Realtime API</p>
                  </div>
                </div>
                <div className="space-y-3 min-h-[320px]">
                  {conversationSteps.slice(0, conversationStep + 1).map((step, index) => (
                    <div key={index} className={`flex ${step.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] ${step.speaker === 'ai' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-gray-800 border-gray-700'} border rounded-xl p-3`}>
                        <div className="flex items-center space-x-1 mb-1">
                          {step.speaker === 'ai' ? <><Brain className="w-3 h-3 text-blue-400" /><span className="text-[10px] font-semibold text-blue-400">AI DISPATCHER</span></> : <><Mic className="w-3 h-3 text-gray-400" /><span className="text-[10px] font-semibold text-gray-400">CALLER</span></>}
                        </div>
                        <p className="text-sm leading-relaxed">{step.text}</p>
                        {index === conversationStep && (
                          <div className="flex items-center space-x-1 mt-2">
                            {[...Array(15)].map((_, i) => (
                              <div key={i} className={`w-0.5 rounded-full ${step.speaker === 'ai' ? 'bg-blue-400' : 'bg-gray-400'}`} style={{ height: `${Math.random() * 12 + 4}px`, animation: 'pulse 0.8s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: CAD Dashboard */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-gray-800/50 border-b border-gray-700 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="font-bold">2. CAD Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                </div>
                <div className="p-4 min-h-[320px]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Active Calls</span>
                    <span className="text-xs text-gray-400">{activeCalls.length} active</span>
                  </div>
                  <div className="space-y-2">
                    {activeCalls.length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for calls...</p>
                      </div>
                    ) : (
                      activeCalls.filter(c => c && c.type).map((call, index) => (
                        <div key={call.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded ${call.type === 'Medical' ? 'bg-red-500/20 text-red-400' : call.type === 'Fire' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{call.type}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{call.time}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${call.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{call.status}</span>
                          </div>
                          <div className="ml-8 text-xs text-gray-400">
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{call.location}</div>
                            <p className="mt-0.5">{call.description}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Panel 3: Officer Radio App */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-green-500/20 rounded-lg"><Smartphone className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <h3 className="text-lg font-bold">3. Officer Radio App</h3>
                    <p className="text-xs text-gray-500">Mobile PTT + AI Dispatch Voice</p>
                  </div>
                </div>
                {/* Phone mockup */}
                <div style={{ background: '#111', border: '2px solid #333', borderRadius: '20px', padding: '8px', maxWidth: '260px', margin: '0 auto' }}>
                  <div style={{ background: '#0a0e1a', borderRadius: '14px', padding: '12px', minHeight: '320px' }}>
                    {/* Status bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280', marginBottom: '8px', padding: '0 4px' }}>
                      <span>●●● Patriot Radio</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Wifi className="w-3 h-3" style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981' }}>CONNECTED</span>
                      </div>
                    </div>
                    {/* Radio messages */}
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {radioSteps.slice(0, radioStep + 1).map((step, i) => (
                        <div key={i} style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: step.speaker === 'dispatch' ? '#1e3a5f' : '#1a2e1a',
                          border: `1px solid ${step.speaker === 'dispatch' ? '#3b82f640' : '#22c55e40'}`,
                        }}>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', color: step.speaker === 'dispatch' ? '#60a5fa' : '#4ade80', marginBottom: '3px' }}>
                            {step.speaker === 'dispatch' ? '📡 AI DISPATCH' : '🎙️ OFFICER'}
                          </div>
                          <div style={{ color: '#d1d5db', lineHeight: '1.3' }}>{step.text}</div>
                        </div>
                      ))}
                    </div>
                    {/* PTT Button */}
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto',
                        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                        border: '3px solid #60a5fa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                      }}>
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>PUSH TO TALK</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow arrows */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Caller calls 911 → AI handles the conversation → CAD entry auto-created → Dispatch alert sent to officer radio → Officer responds via PTT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === FEATURES SECTION === */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything an Agency <span className="text-blue-400">Needs</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From the 911 call to the officer on scene — fully AI-powered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              { icon: <Brain className="w-8 h-8" />, title: "AI 911 Dispatcher", desc: "OpenAI Realtime API handles 911 calls with natural voice-to-voice conversation. Gathers location, incident type, and caller info automatically.", tag: "Voice AI" },
              { icon: <Smartphone className="w-8 h-8" />, title: "Officer Radio App", desc: "Mobile app with push-to-talk radio. Officers talk to AI dispatch, run plates, check warrants, and get real-time alerts — all by voice.", tag: "Mobile" },
              { icon: <Radio className="w-8 h-8" />, title: "Real Radio Protocol", desc: "AI dispatch uses proper 10-codes, short clipped responses, and radio squelch effects. Sounds like a real police radio.", tag: "10-Codes" },
              { icon: <Zap className="w-8 h-8" />, title: "Instant Dispatch Alerts", desc: "When a 911 call comes in, officers get immediate dispatch alerts on their radio app with incident details and caller statements.", tag: "Real-time" },
              { icon: <Shield className="w-8 h-8" />, title: "Full CAD System", desc: "Computer-Aided Dispatch with call management, unit tracking, person/vehicle database, citations, warrants, and incident reports.", tag: "Enterprise" },
              { icon: <MapPin className="w-8 h-8" />, title: "Database Lookups by Voice", desc: "Officers say a name or plate number and the AI dispatcher searches the database and reads back results — warrants, priors, citations.", tag: "Voice Search" },
              { icon: <MessageSquare className="w-8 h-8" />, title: "SMS 911 Support", desc: "Text-based 911 for situations where voice calls aren't possible. Same AI handles the conversation via text message.", tag: "Text" },
              { icon: <Users className="w-8 h-8" />, title: "Multi-Role Access", desc: "Separate interfaces for dispatchers, officers, and admins. Role-based permissions with secure JWT authentication.", tag: "Secure" },
              { icon: <Volume2 className="w-8 h-8" />, title: "Call Recording", desc: "Every 911 call is recorded via Twilio. Recordings linked to CAD entries for review, evidence, and quality assurance.", tag: "Recording" }
            ].map((f, i) => (
              <div key={i} className="group relative p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">{f.tag}</div>
                <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === HOW IT WORKS === */}
      <div className="relative py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It <span className="text-blue-400">Works</span></h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* 911 Call Flow */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-red-500/20 rounded-lg"><Phone className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-xl font-bold">911 Call Flow</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { n: '1', title: 'Caller Dials 911', desc: 'Twilio routes the call and streams audio via WebSocket' },
                    { n: '2', title: 'AI Dispatcher Answers', desc: 'OpenAI Realtime API has a natural voice conversation with the caller' },
                    { n: '3', title: 'CAD Entry Created', desc: 'AI extracts location, incident type, priority and creates a call record' },
                    { n: '4', title: 'Officers Alerted', desc: 'Dispatch alert with caller details sent to all connected officer radios' },
                    { n: '5', title: 'Officer Responds', desc: 'Officer acknowledges via PTT, gets additional info from AI dispatch' }
                  ].map(s => (
                    <div key={s.n} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">{s.n}</div>
                      <div><h4 className="font-semibold mb-1">{s.title}</h4><p className="text-sm text-gray-400">{s.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Officer Radio Flow */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500/20 rounded-lg"><Radio className="w-5 h-5 text-green-400" /></div>
                  <h3 className="text-xl font-bold">Officer Radio Features</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: <Mic className="w-4 h-4" />, title: 'Push-to-Talk Voice', desc: 'Hold button to talk, release to send. AI responds with voice.' },
                    { icon: <AlertCircle className="w-4 h-4" />, title: 'Dispatch Alerts', desc: 'Real-time alerts when new 911 calls come in with full details.' },
                    { icon: <Brain className="w-4 h-4" />, title: 'Voice Commands', desc: '"Run a plate ABC123" — AI searches database and reads results.' },
                    { icon: <Shield className="w-4 h-4" />, title: 'Warrant Checks', desc: '"Check warrants for John Doe" — instant results with priors.' },
                    { icon: <Radio className="w-4 h-4" />, title: '10-Code Protocol', desc: 'AI uses proper 10-codes: 10-4, 10-76, 10-97, etc.' },
                    { icon: <Volume2 className="w-4 h-4" />, title: 'Radio Effects', desc: 'Squelch, beeps, and dispatch tones for realistic radio feel.' }
                  ].map((f, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-green-400 mt-0.5">{f.icon}</div>
                      <div><h4 className="font-semibold text-sm">{f.title}</h4><p className="text-xs text-gray-400">{f.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === TECH STACK === */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Technology <span className="text-blue-400">Stack</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-blue-400">AI / Voice</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {['OpenAI Realtime API (gpt-4o-realtime)', 'Bidirectional WebSocket audio', 'Real-time transcription', 'Function calling for DB lookups', 'PTT manual turn detection'].map(t => (
                    <li key={t} className="flex items-start"><ChevronRight className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-cyan-400">Backend</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {['FastAPI with async WebSockets', 'MongoDB for all data', 'Twilio for telephony + SMS', 'JWT authentication', 'Heroku deployment'].map(t => (
                    <li key={t} className="flex items-start"><ChevronRight className="w-4 h-4 text-cyan-500 mr-2 flex-shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-green-400">Frontend / Mobile</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {['React CAD dashboard', 'Expo React Native radio app', 'expo-av for audio recording', 'WebSocket real-time comms', 'Push-to-talk interface'].map(t => (
                    <li key={t} className="flex items-start"><ChevronRight className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === CTA === */}
      <div className="relative py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Try It Live</h2>
            <p className="text-xl text-gray-400 mb-10">
              Call the AI dispatcher or sign in to explore the full system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => window.open('tel:+18704992134')} className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/50">
                <Phone className="w-6 h-6" />
                <span className="font-semibold text-lg">Call +1 (870) 499-2134</span>
              </button>
              <button onClick={() => navigate('/login')} className="px-10 py-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3">
                <span className="font-semibold text-lg">Access Dashboard</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold">Patriot CAD Systems</span>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>AI-Powered Emergency Dispatch System</p>
              <p className="mt-1">OpenAI Realtime API + Expo Mobile Radio App</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
