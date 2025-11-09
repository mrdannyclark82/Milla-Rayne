import React, { useState, useEffect, useRef } from 'react';

// --- HELPER COMPONENTS (ICONS) --- //
const Icon = ({ name, className = 'w-6 h-6' }) => {
  const icons = {
    google: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.75 8.36,4.73 12.19,4.73C14.03,4.73 15.69,5.36 16.95,6.57L19.03,4.5C17.02,2.64 14.69,1.73 12.19,1.73C6.69,1.73 2.19,6.23 2.19,12C2.19,17.77 6.69,22.27 12.19,22.27C17.6,22.27 21.5,18.33 21.5,12.33C21.5,11.83 21.43,11.46 21.35,11.1Z" />
      </svg>
    ),
    youtube: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.73,18.78 17.93,18.84C17.13,18.91 16.44,18.94 15.84,18.94L15,19C12.81,19 11.2,18.84 10.17,18.56C9.27,18.31 8.69,17.73 8.44,16.83C8.31,16.36 8.22,15.73 8.16,14.93C8.09,14.13 8.06,13.44 8.06,12.84L8,12C8,9.81 8.16,8.2 8.44,7.17C8.69,6.27 9.27,5.69 10.17,5.44C11.2,5.16 12.81,5 15,5L15.84,5.06C16.44,5.06 17.13,5.09 17.93,5.16C18.73,5.22 19.36,5.31 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" />
      </svg>
    ),
    send: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        ></path>
      </svg>
    ),
    briefing: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1V8a1 1 0 00-1-1H9a1 1 0 00-1 1v12a1 1 0 001 1h6z"
        ></path>
      </svg>
    ),
    menu: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16M4 18h16"
        ></path>
      </svg>
    ),
    close: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    ),
    tools: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        ></path>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        ></path>
      </svg>
    ),
    key: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
        ></path>
      </svg>
    ),
    mic: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        ></path>
      </svg>
    ),
    videocam: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        ></path>
      </svg>
    ),
  };
  return icons[name] || null;
};

// --- API & MOCK DATA --- //
async function getGeminiChatResponse(messages) {
  return 'This is a simulated response from Milla.';
}
async function getCalendarEvents() {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          { time: '10:00 AM', title: 'Project Stand-up' },
          { time: '1:00 PM', title: 'Lunch with the design team' },
          { time: '3:30 PM', title: 'Q4 Strategy Review' },
        ]),
      500
    )
  );
}
async function getDailyBriefing() {
  const apiKey = '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  const calendarEvents = await getCalendarEvents();
  const schedule = calendarEvents
    .map((e) => `- ${e.time}: ${e.title}`)
    .join('\n');
  const systemPrompt =
    "You are a world-class executive assistant named Milla Rayne. Your goal is to provide a concise, positive, and motivating daily briefing. Start with the user's schedule for the day.";
  const userQuery = `My schedule today is:\n${schedule}\n\nNow, generate a daily briefing for me. Today is October 12, 2025. My location is Judsonia, Arkansas. After my schedule, include a quick summary of top world news, a notable event in history for today's date, and a short motivational quote.`;
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ google_search: {} }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`API call failed with status: ${response.status}`);
    const result = await response.json();
    return (
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Could not fetch the daily briefing.'
    );
  } catch (error) {
    console.error('Gemini API (briefing) call error:', error);
    return 'There was an error fetching the briefing. Please check your connection and API key.';
  }
}

// --- UI COMPONENTS --- //
const ParallaxLayer = ({ children, className = '', depth = 0 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) * depth;
      const y = (clientY - window.innerHeight / 2) * depth;
      setPosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [depth]);
  return (
    <div
      className={`absolute inset-0 transition-transform duration-500 ease-out ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {children}
    </div>
  );
};
const GlassCard = ({ children, className = '' }) => (
  <div
    className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl ${className}`}
  >
    {children}
  </div>
);
const NeonButton = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full px-6 py-3 rounded-lg text-white font-bold transition-all duration-300 bg-blue-violet-500/50 border border-blue-violet-500 hover:bg-blue-violet-500/80 hover:shadow-[0_0_20px_rgba(138,43,226,0.8)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);
const InputField = ({ type, placeholder, icon, value, onChange }) => (
  <div className="relative mb-2">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
      {icon}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-4 py-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-violet-500 text-white"
    />
  </div>
);
const ChatThread = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  return (
    <GlassCard className="h-full flex flex-col p-4">
      <div className="flex-grow overflow-y-auto pr-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-blue-violet-500 flex-shrink-0"></div>
            )}
            <div
              className={`px-4 py-2 rounded-2xl max-w-lg text-white ${msg.sender === 'user' ? 'bg-blue-violet-500 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-violet-500 flex-shrink-0"></div>
            <div className="px-4 py-2 rounded-2xl max-w-lg text-white bg-gray-700 rounded-bl-none">
              <p className="animate-pulse">Milla is typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </GlassCard>
  );
};
const ChatInput = ({ onSend, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const handleSend = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
    }
  };
  return (
    <GlassCard className="w-full max-w-4xl p-2">
      <form
        className="flex items-center"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="flex-grow bg-transparent focus:outline-none text-white text-lg placeholder-white/50 px-4"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="ml-4 p-3 rounded-full bg-blue-violet-500 hover:bg-blue-violet-600 transition-colors disabled:bg-gray-600"
        >
          <Icon name="send" className="w-6 h-6 text-white" />
        </button>
      </form>
    </GlassCard>
  );
};
const DailyBriefingCard = () => {
  const [briefing, setBriefing] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleFetchBriefing = async () => {
    setIsLoading(true);
    const text = await getDailyBriefing();
    setBriefing(text);
    setIsLoading(false);
  };
  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className="text-blue-violet-400">
          <Icon name="briefing" />
        </div>
        <h3 className="text-xl font-bold text-white ml-3">Daily Briefing</h3>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-violet-400"></div>
          </div>
        ) : briefing ? (
          <p className="text-white/80 whitespace-pre-wrap">{briefing}</p>
        ) : (
          <p className="text-white/50">
            Get your personalized daily briefing, including calendar events.
          </p>
        )}
      </div>
      <NeonButton
        onClick={handleFetchBriefing}
        disabled={isLoading}
        className="mt-4"
      >
        ✨ Get Today's Briefing
      </NeonButton>
    </GlassCard>
  );
};

const SettingToggle = ({ label, id, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-white/80">{label}</span>
    <label
      htmlFor={id}
      className="inline-flex relative items-center cursor-pointer"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        id={id}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-violet-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-violet-500"></div>
    </label>
  </div>
);

const SidePanel = ({ isOpen, onClose, onOpenYouTube, onOpenLiveVideo }) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState({
    devTalk: true,
    predictiveUpdates: true,
    predictiveRecommendations: false,
    selfImprovement: true,
  });
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    openrouter: '',
    mistral: '',
    openai: '',
  });

  const toggleSetting = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleApiKeyChange = (key, value) =>
    setApiKeys((prev) => ({ ...prev, [key]: value }));

  const TabButton = ({ name, label }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 py-2 text-lg font-bold rounded-t-lg transition-colors ${activeTab === name ? 'text-white bg-white/10' : 'text-white/50 hover:bg-white/5'}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} pointer-events-auto`}
    >
      <GlassCard className="h-full w-96 rounded-none rounded-r-2xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-white">Menu</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <Icon name="close" />
          </button>
        </div>
        <div className="border-b border-white/10 mb-4">
          <TabButton name="settings" label="Settings" />
          <TabButton name="tools" label="Tools" />
        </div>
        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          {activeTab === 'settings' && (
            <>
              <GlassCard>
                <h3 className="text-xl font-bold mb-2">Developer</h3>
                <SettingToggle
                  label="Enable Dev Talk"
                  id="devTalk"
                  checked={settings.devTalk}
                  onChange={() => toggleSetting('devTalk')}
                />
                <SettingToggle
                  label="Predictive Updates"
                  id="predictiveUpdates"
                  checked={settings.predictiveUpdates}
                  onChange={() => toggleSetting('predictiveUpdates')}
                />
                <SettingToggle
                  label="Predictive Recommendations"
                  id="predictiveRecommendations"
                  checked={settings.predictiveRecommendations}
                  onChange={() => toggleSetting('predictiveRecommendations')}
                />
                <SettingToggle
                  label="Self-Improvement Engine"
                  id="selfImprovement"
                  checked={settings.selfImprovement}
                  onChange={() => toggleSetting('selfImprovement')}
                />
              </GlassCard>
              <GlassCard>
                <h3 className="text-xl font-bold mb-2">AI Configuration</h3>
                <label className="text-sm text-white/70 mb-2 block">
                  Active Model
                </label>
                <select className="w-full bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-violet-500 text-white p-3 mb-4">
                  <option>Gemini</option>
                  <option>OpenRouter</option>
                  <option>Mistral</option>
                  <option>OpenAI</option>
                </select>
                <InputField
                  type="password"
                  placeholder="Gemini API Key"
                  icon={<Icon name="google" className="w-5 h-5" />}
                  value={apiKeys.gemini}
                  onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                />
              </GlassCard>
            </>
          )}
          {activeTab === 'tools' && (
            <>
              <GlassCard>
                <h3 className="text-xl font-bold mb-2">Media Tools</h3>
                <NeonButton
                  onClick={() => {
                    onOpenYouTube();
                    onClose();
                  }}
                  className="mb-4 flex items-center justify-center gap-2"
                >
                  🎬 Open YouTube Analyzer
                </NeonButton>
                <NeonButton
                  onClick={() => {
                    onOpenLiveVideo();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  📷 Open Live Video Analyzer
                </NeonButton>
              </GlassCard>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

const YouTubeModal = ({ isOpen, onClose }) => {
  /* ... unchanged ... */ return null;
};

const LiveVideoAnalyzerModal = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);
  const [analysis, setAnalysis] = useState('Analysis will appear here.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let stream;
    if (
      isOpen &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((err) => console.error('Error accessing webcam:', err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate Gemini API call for video analysis
    setTimeout(() => {
      const insights = [
        'Object Detected: Human Face (Emotion: Neutral)',
        'Object Detected: Laptop (Confidence: 92%)',
        'Insight: User appears to be focused on the screen.',
        'Ambient lighting is adequate.',
      ];
      setAnalysis(insights.join('\n'));
      setIsAnalyzing(false);
    }, 2000);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-40 flex items-center justify-center p-4 pointer-events-auto">
      <GlassCard className="w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="text-blue-violet-400">
              <Icon name="videocam" />
            </div>
            <h3 className="text-xl font-bold text-white ml-3">
              Live Video Analyzer
            </h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
          <div className="flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full rounded-lg bg-black object-cover mb-4"
            ></video>
            <NeonButton onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? '✨ Analyzing...' : '✨ Start Analysis'}
            </NeonButton>
          </div>
          <div className="flex flex-col bg-black/20 rounded-lg p-4 h-full overflow-y-auto">
            <h4 className="font-bold text-lg mb-2 text-white/90">
              Real-time Insights
            </h4>
            <div className="text-white/80 whitespace-pre-wrap text-sm">
              {isAnalyzing ? (
                <div className="animate-pulse">Analyzing video feed...</div>
              ) : (
                analysis
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// --- OVERLAY SCREENS --- //
const LoginOverlay = ({ onLogin, isVisible }) => {
  return (
    <div
      className={`absolute inset-0 w-full h-screen flex items-center justify-center z-20 p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="w-full max-w-md mx-auto">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">Milla Rayne</h1>
            <p className="text-white/70">Your AI Companion</p>
          </div>
          <div className="space-y-4">
            <NeonButton
              onClick={onLogin}
              className="flex items-center justify-center gap-2"
            >
              <Icon name="google" />
              Sign in with Google
            </NeonButton>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-4 text-white/50">OR</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>
            <InputField
              type="email"
              placeholder="Email"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />
            <InputField
              type="password"
              placeholder="Password"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
            <NeonButton onClick={onLogin}>Login</NeonButton>
          </div>
          <p className="text-center text-sm text-white/50 mt-6">
            Don't have an account?{' '}
            <a
              href="#"
              className="font-semibold text-blue-violet-400 hover:underline"
            >
              Register
            </a>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

const MainOverlay = ({ onLogout, isVisible }) => {
  const [isSidePanelOpen, setSidePanelOpen] = useState(false);
  const [isYouTubePlayerOpen, setIsYouTubePlayerOpen] = useState(false);
  const [isLiveVideoOpen, setIsLiveVideoOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Milla Rayne. How can I assist you today?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const handleSend = async (newMessageText) => {
    setIsLoading(true);
    const aiResponseText = await getGeminiChatResponse([
      ...messages,
      { sender: 'user', text: newMessageText },
    ]);
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: newMessageText },
      { sender: 'ai', text: aiResponseText },
    ]);
    setIsLoading(false);
  };

  return (
    <div
      className={`absolute inset-0 w-full h-screen text-white transition-opacity duration-500 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        onOpenYouTube={() => setIsYouTubePlayerOpen(true)}
        onOpenLiveVideo={() => setIsLiveVideoOpen(true)}
      />
      <YouTubeModal
        isOpen={isYouTubePlayerOpen}
        onClose={() => setIsYouTubePlayerOpen(false)}
      />
      <LiveVideoAnalyzerModal
        isOpen={isLiveVideoOpen}
        onClose={() => setIsLiveVideoOpen(false)}
      />

      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 pointer-events-auto">
        <button
          onClick={() => setSidePanelOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <Icon name="menu" className="w-8 h-8" />
        </button>
        <h1 className="text-2xl font-bold">Milla Rayne</h1>
        <button
          onClick={onLogout}
          className="text-sm font-semibold hover:underline"
        >
          Logout
        </button>
      </header>

      <div className="absolute top-20 bottom-32 left-0 right-0 flex p-4 gap-4">
        {/* Left Panel */}
        <div className="w-1/3 lg:w-1/4 flex flex-col items-center justify-center pointer-events-none">
          <ParallaxLayer depth={0.03}>
            <div className="flex items-center justify-center h-full">
              <div className="relative w-48 h-48 -mt-24">
                <div className="absolute inset-0 rounded-full bg-blue-violet-500/30 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full border-2 border-blue-violet-400"></div>
                <img
                  src="https://placehold.co/192x192/100a2d/8A2BE2?text=M"
                  alt="Milla Rayne Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          </ParallaxLayer>
        </div>
        {/* Center Panel */}
        <div className="w-2/3 lg:w-1/2 flex-grow pointer-events-auto">
          <ChatThread messages={messages} isLoading={isLoading} />
        </div>
        {/* Right panel */}
        <div className="hidden lg:block lg:w-1/4 pointer-events-auto">
          <DailyBriefingCard />
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center z-20 pointer-events-auto">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </footer>
    </div>
  );
};

// --- APP ROOT --- //
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `:root { --blue-violet-500: #8A2BE2; --blue-violet-400: #9370DB; --blue-violet-800: #4B0082; } .bg-blue-violet-500 { background-color: var(--blue-violet-500); } .bg-blue-violet-500\\/50 { background-color: rgba(138, 43, 226, 0.5); } .bg-blue-violet-500\\/80 { background-color: rgba(138, 43, 226, 0.8); } .border-blue-violet-500 { border-color: var(--blue-violet-500); } .ring-blue-violet-500 { --tw-ring-color: var(--blue-violet-500); } .ring-blue-violet-800 { --tw-ring-color: var(--blue-violet-800); } .text-blue-violet-400 { color: var(--blue-violet-400); } .animated-gradient { background: linear-gradient(-45deg, #0a021c, #100a2d, #2f0f4f, #000000); background-size: 400% 400%; animation: gradient 15s ease infinite; } @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return (
    <div className="font-sans h-screen w-screen overflow-hidden relative animated-gradient">
      <ParallaxLayer depth={-0.01}>
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'url(https://www.transparenttextures.com/patterns/stardust.png)',
          }}
        ></div>
      </ParallaxLayer>
      <ParallaxLayer depth={0}>
        <div className="absolute inset-0 z-10">
          <LoginOverlay onLogin={handleLogin} isVisible={!isAuthenticated} />
          <MainOverlay onLogout={handleLogout} isVisible={isAuthenticated} />
        </div>
      </ParallaxLayer>
    </div>
  );
}
