import { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import AnalysisPage from './components/AnalysisPage';
import ChatbotPage from './components/ChatbotPage';
import './App.css';

function App() {
  const [page, setPage] = useState("Welcome");
  const [patientData, setPatientData] = useState({});
  
  return (
    <>
      <nav className="bg-teal-400 p-4 flex justify-between items-center shadow-lg">
        <span className="font-bold text-blue-900 text-2xl">🩺 MEDICO AI</span>
        <div className="flex gap-4">
          <button 
            className={`font-bold px-4 py-2 rounded transition ${page === "Welcome" ? "bg-blue-900 text-white" : "text-blue-900 hover:bg-teal-300"}`}
            onClick={() => setPage("Welcome")}
          >
            Welcome
          </button>
          <button 
            className={`font-bold px-4 py-2 rounded transition ${page === "Analysis" ? "bg-blue-900 text-white" : "text-blue-900 hover:bg-teal-300"}`}
            onClick={() => setPage("Analysis")}
          >
            Analysis
          </button>
          <button 
            className={`font-bold px-4 py-2 rounded transition ${page === "Chatbot" ? "bg-blue-900 text-white" : "text-blue-900 hover:bg-teal-300"}`}
            onClick={() => setPage("Chatbot")}
          >
            Chatbot
          </button>
        </div>
      </nav>
      {page === "Welcome" && (
        <WelcomePage onProceed={(pd) => { setPatientData(pd); setPage("Analysis"); }} />
      )}
      {page === "Analysis" && (
        <AnalysisPage patientName={patientData.patientName} patientId={patientData.patientId} />
      )}
      {page === "Chatbot" && (
        <ChatbotPage />
      )}
    </>
  );
}

export default App;
