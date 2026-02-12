import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Zap, Shield, Brain, Radio, MapPin, Users, ChevronRight, Play, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeCalls, setActiveCalls] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate incoming calls for demo
  useEffect(() => {
    const demoCallsData = [
      {
        id: 1,
        type: 'Medical',
        location: '1247 Oak Street',
        description: 'Chest pain, 67-year-old male',
        priority: 1,
        status: 'Active',
        time: '14:23:15'
      },
      {
        id: 2,
        type: 'Fire',
        location: '892 Maple Avenue',
        description: 'Structure fire, smoke visible',
        priority: 1,
        status: 'Dispatched',
        time: '14:21:42'
      },
      {
        id: 3,
        type: 'Police',
        location: '3401 Pine Boulevard',
        description: 'Traffic accident with injuries',
        priority: 2,
        status: 'Active',
        time: '14:19:08'
      }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < demoCallsData.length) {
        setActiveCalls(prev => [demoCallsData[currentIndex], ...prev]);
        currentIndex++;
      } else {
        // Reset after showing all calls
        setTimeout(() => {
          setActiveCalls([]);
          currentIndex = 0;
        }, 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Dispatcher",
      description: "OpenAI Realtime API enables natural voice-to-voice conversations with sub-500ms latency. Handles emergencies with empathy and precision.",
      highlight: "Voice AI"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Response",
      description: "True real-time audio streaming. No delays, no robotic pauses. Just natural conversation that feels human.",
      highlight: "Real-time"
    },
    {
      icon: <Radio className="w-8 h-8" />,
      title: "Smart Dispatch",
      description: "Automatically extracts location and incident type. Dispatches appropriate units within seconds of gathering critical information.",
      highlight: "Automated"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Live Tracking",
      description: "Real-time officer location tracking, unit status board, and interactive map view for complete situational awareness.",
      highlight: "GPS Enabled"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Complete CAD System",
      description: "Full Computer-Aided Dispatch with officer MDT, database search, citation management, and incident reporting.",
      highlight: "Enterprise"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Role Access",
      description: "Separate interfaces for dispatchers, officers, and administrators. Role-based permissions and secure authentication.",
      highlight: "Secure"
    }
  ];

  const stats = [
    { value: "<500ms", label: "Response Latency" },
    { value: "24/7", label: "AI Availability" },
    { value: "100%", label: "Call Recording" },
    { value: "Real-time", label: "Transcription" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.5}px)`
        }} />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-20 pb-32">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-20">
            <div className="flex items-center space-x-3">
              <Shield className="w-10 h-10 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Patriot CAD
              </span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
          </nav>

          {/* Hero Content */}
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 text-sm font-semibold">Powered by OpenAI Realtime API</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The Future of
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Emergency Dispatching
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered 911 dispatcher with true voice-to-voice conversation. 
              Natural, empathetic, and lightning-fast emergency response powered by cutting-edge AI technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.open('tel:+18704992134')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg shadow-blue-500/50"
              >
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Try Live Demo</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span className="font-semibold">View Dashboard</span>
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Call <span className="text-blue-400 font-mono">+1 (870) 499-2134</span> to experience the AI dispatcher
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Features Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-blue-400">Modern Emergency Response</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete Computer-Aided Dispatch system with AI at its core
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                  {feature.highlight}
                </div>
                
                <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Demo Section */}
      <div className="relative py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                See It <span className="text-blue-400">In Action</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Watch how calls are processed in real-time by our AI dispatcher
              </p>
            </div>

            {/* Mock Dispatcher Dashboard */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Dashboard Header */}
              <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-500" />
                  <span className="font-bold text-lg">Dispatcher Dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">Live</span>
                </div>
              </div>

              {/* Active Calls List */}
              <div className="p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Active Calls</h3>
                  <span className="text-sm text-gray-400">{activeCalls.length} active</span>
                </div>

                <div className="space-y-3">
                  {activeCalls.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Waiting for incoming calls...</p>
                    </div>
                  ) : (
                    activeCalls.filter(call => call && call.type).map((call, index) => (
                      <div
                        key={call.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 animate-slideIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              call.type === 'Medical' ? 'bg-red-500/20 text-red-400' :
                              call.type === 'Fire' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {call.type === 'Medical' ? <AlertCircle className="w-5 h-5" /> :
                               call.type === 'Fire' ? <AlertCircle className="w-5 h-5" /> :
                               <Shield className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-semibold">{call.type} Emergency</div>
                              <div className="text-sm text-gray-400 flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>{call.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            call.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {call.status}
                          </div>
                        </div>
                        <div className="ml-11 space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-300">{call.location}</span>
                          </div>
                          <p className="text-sm text-gray-400">{call.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className={`px-2 py-1 rounded text-xs font-semibold ${
                              call.priority === 1 ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              Priority {call.priority}
                            </div>
                            {call.status === 'Dispatched' && (
                              <div className="flex items-center space-x-1 text-xs text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>Units dispatched</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              This is a simulated demo. Real calls are processed with AI voice recognition and natural language understanding.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="relative py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Powered by <span className="text-blue-400">Cutting-Edge AI</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Built on the latest technology stack for maximum performance and reliability
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-blue-400">Voice AI Technology</h3>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>OpenAI Realtime API (gpt-4o-realtime-preview)</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Bidirectional audio streaming via WebSockets</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Whisper-1 for real-time transcription</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Natural voice activity detection</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-cyan-400">Infrastructure</h3>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>FastAPI backend with async WebSocket support</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>React frontend with real-time updates</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>MongoDB for scalable data storage</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Twilio integration for telephony</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Call our AI dispatcher now or sign in to explore the full CAD system
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.open('tel:+18704992134')}
                className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/50"
              >
                <Phone className="w-6 h-6" />
                <span className="font-semibold text-lg">Call +1 (870) 499-2134</span>
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3"
              >
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
              <p>AI Test System for Demonstration Purposes</p>
              <p className="mt-1">Powered by OpenAI Realtime API</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
