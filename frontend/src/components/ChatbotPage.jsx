import { useState, useRef, useEffect } from 'react';
import { api, errorMessage } from '../api';

const STARTER_QUESTIONS = [
  "What is the difference between a fracture and a sprain?",
  "What does an optic disc examination look for?",
  "What symptoms usually prompt a chest X-ray for tuberculosis?",
  "How can I prepare for a radiologist appointment?",
];

function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([
    {
      user: null,
      bot: "Hello. I am the Medico clinical information assistant. You can ask me questions about medical imaging terms, common symptoms, and general health topics."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  const handleSubmit = async (customQuestion) => {
    const question = (customQuestion || query).trim();
    if (!question || loading) return;

    setLoading(true);
    setError('');
    setHistory(prev => [...prev, { user: question, bot: null }]);
    setQuery("");

    try {
      const res = await api.post('/api/chatbot/', { query: question });
      setHistory(prev => {
        const next = [...prev];
        next[next.length - 1].bot = res.data.response;
        return next;
      });
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg);
      setHistory(prev => {
        const next = [...prev];
        next[next.length - 1].bot = `Error: ${msg}`;
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHistory([
      {
        user: null,
        bot: "Conversation history cleared. What medical topic would you like to explore?"
      }
    ]);
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col bg-lemon text-ruby p-4 sm:p-6">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col bg-[#FAF3EC] border border-ruby/20 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-ruby/15 flex justify-between items-center bg-[#F5ECE1]">
          <div>
            <h1 className="text-base font-bold text-ruby">
              Medical Information Assistant
            </h1>
            <p className="text-xs text-ruby/70 font-medium">
              General educational guidance powered by Google Gemini
            </p>
          </div>

          <button
            onClick={handleClear}
            className="text-xs px-2.5 py-1 rounded-lg border border-ruby/30 text-ruby font-semibold hover:bg-ruby hover:text-lemon transition-colors cursor-pointer"
          >
            Clear History
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {history.map((msg, idx) => (
            <div key={idx} className="space-y-2">
              {msg.user && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-ruby text-lemon rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-xs">
                    {msg.user}
                  </div>
                </div>
              )}

              {msg.bot && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-ruby/20 text-ruby rounded-xl px-4 py-3 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium shadow-2xs">
                    {msg.bot}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && history[history.length - 1]?.user && !history[history.length - 1]?.bot && (
            <div className="flex justify-start">
              <div className="bg-white border border-ruby/20 rounded-xl px-4 py-2.5 text-xs text-ruby/70 flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-ruby animate-pulse" />
                <span>Formulating response…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {history.length <= 2 && (
          <div className="px-4 sm:px-6 py-2.5 border-t border-ruby/15 bg-white/50">
            <p className="text-[11px] font-bold text-ruby/70 mb-1.5">Common questions to get started:</p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(q)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-ruby hover:text-lemon border border-ruby/25 text-ruby font-medium transition-colors text-left cursor-pointer shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2 bg-red-100 border-t border-red-300 text-xs text-red-900 font-semibold">
            {error}
          </div>
        )}

        {/* Query Input */}
        <div className="p-4 border-t border-ruby/15 bg-white/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={2000}
              placeholder="Ask a question about a medical condition, symptom, or scan..."
              className="flex-1 bg-white border border-ruby/30 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-ruby placeholder-ruby/40 focus:outline-none focus:border-ruby transition-colors font-medium"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-ruby hover:bg-ruby-hover active:bg-ruby-dark disabled:opacity-40 disabled:cursor-not-allowed text-lemon font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Send
            </button>
          </form>
          <p className="text-[11px] text-ruby/60 text-center mt-2 font-medium">
            Educational assistant only. Always verify medical guidance with a certified physician.
          </p>
        </div>

      </div>
    </div>
  );
}

export default ChatbotPage;
