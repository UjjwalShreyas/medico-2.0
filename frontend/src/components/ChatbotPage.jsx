import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const handleSubmit = async () => {
    let res = await axios.post(`${API_URL}/api/chatbot/`, { query });
    setHistory([...history, { user: query, bot: res.data.response }]);
    setQuery("");
  };
  return (
    <div className="p-8 min-h-screen bg-blue-900 text-white">
      <h2 className="text-3xl mb-4">💬 Medico AI Chatbot</h2>
      <input className="p-2 text-black rounded w-2/3" 
        value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Ask any question..." />
      <button className="bg-teal-400 text-blue-900 px-4 py-2 rounded ml-2" onClick={handleSubmit}>Ask</button>
      <div className="mt-6">
        {history.map((msg, idx) => (
          <div key={idx} className="mb-4">
            <p className="text-right text-lg font-bold">{msg.user} 😎</p>
            <p className="text-left text-lg">🤖 {msg.bot}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ChatbotPage;
