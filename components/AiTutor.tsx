import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface AiTutorProps {
  contextData: string;
}

const AiTutor: React.FC<AiTutorProps> = ({ contextData }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: "Hi! I'm your RL Tutor. I'm watching your simulation. Ask me anything about Q-Learning or why the agent is moving that way!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !process.env.API_KEY) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          System: You are an expert Reinforcement Learning tutor helping a student visualize Q-Learning.
          Current Simulation Context: ${contextData}
          User Question: ${userMsg}
          
          Keep the answer concise, encouraging, and directly related to what they are seeing on the grid. 
          If they ask about the difference between Model-Based and Model-Free, explain using the "Planning Steps" concept.
        `,
      });
      
      const text = response.text || "I couldn't generate a response. Try again!";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI tutor." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-none lg:rounded-xl border-none lg:border-none overflow-hidden">
      <div className="bg-indigo-900/20 p-4 border-b border-indigo-500/20 flex items-center gap-2 shrink-0">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-indigo-100">AI Tutor</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-900" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-lg p-3 text-sm shadow-md
              ${m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
                 {m.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
                 <span>{m.role === 'user' ? 'You' : 'Tutor'}</span>
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 rounded-bl-none">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-800 border-t border-slate-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={process.env.API_KEY ? "Ask about Q-values..." : "API Key Missing"}
            disabled={!process.env.API_KEY || loading}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleSend}
            disabled={!process.env.API_KEY || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md transition-colors shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
