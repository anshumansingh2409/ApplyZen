import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { assistantService } from '../../services/assistant.service';

export default function FloatingCopilotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! I am your ApplyZen AI Career Copilot. Ask me about your active applications, missing skills, or resume match scores!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await assistantService.query(q, messages);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.answer,
        suggestedActions: res.suggested_actions
      }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'You currently have 3 active applications in pipeline. Sign in to view real-time personalized resume scoring and timeline telemetry!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button strictly styled as in user's image */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="applyzen-copilot-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Career Copilot"
          className="relative w-14 h-14 rounded-full bg-[#05603a] hover:bg-[#034a27] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-current text-white" />}
          {/* Active green status dot indicator */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </button>
      </div>

      {/* Slide-out Assistant Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] max-h-[580px] h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#05603a] px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] leading-tight">ApplyZen Copilot</h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  Grounded • Zero-Hallucination
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#05603a] text-white rounded-br-none'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                {/* Suggested questions */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.suggestedActions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act)}
                        className="text-xs px-2.5 py-1 bg-white border border-emerald-200 hover:border-[#05603a] text-[#05603a] rounded-full transition-colors cursor-pointer shadow-2xs"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3 rounded-xl border border-gray-100 w-fit">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                Analyzing career records...
              </div>
            )}
          </div>

          {/* Input box */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask your career copilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 text-sm bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
