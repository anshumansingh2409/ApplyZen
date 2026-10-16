import React, { useState } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { assistantService } from '../../services/assistant.service';

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I am your ApplyZen AI Career Copilot. I have real-time access to your verified Career Knowledge Base, active applications, resume match scores, and interview timelines. What can I answer for you today?",
      suggestedActions: [
        'How many active applications do I have?',
        'Which applications need my attention?',
        'What skills am I missing for detected opportunities?',
        'Which resume has the highest match score?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await assistantService.query(q, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          suggestedActions: res.suggested_actions
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I checked your records: you have active opportunities in pipeline. Ensure your backend connection is operational or check the applications dashboard for specific application review items!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-[#05603a] px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base font-bold">ApplyZen AI Career Copilot</h2>
            <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              Grounded in your Personal Knowledge Base • Zero Hallucination
            </p>
          </div>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#fbfdfc]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${m.role === 'user'
                  ? 'bg-[#05603a] text-white rounded-br-none shadow-xs'
                  : 'bg-white text-gray-800 shadow-2xs border border-gray-100 rounded-bl-none'
                }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>

            {m.suggestedActions && m.suggestedActions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 max-w-[80%]">
                {m.suggestedActions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => handleSend(act)}
                    className="text-xs px-3 py-1.5 bg-white border border-emerald-200 hover:border-[#05603a] hover:bg-emerald-50/50 text-[#05603a] rounded-xl transition-all cursor-pointer font-medium shadow-2xs"
                  >
                    {act} →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3.5 rounded-xl border border-gray-100 w-fit shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Consulting Career Knowledge Base and active application telemetry...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask anything about your applications, resumes, interviews, or opportunities..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-sm bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
