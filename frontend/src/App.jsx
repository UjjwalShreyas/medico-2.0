import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import AnalysisPage from './components/AnalysisPage';
import ChatbotPage from './components/ChatbotPage';

function App() {
  const [page, setPage] = useState("Welcome");
  const [patientData, setPatientData] = useState({});
  return (
    <>
      <nav className="bg-teal-400 p-4 flex justify-between">
        <span className="font-bold text-blue-900 text-xl">MEDICO AI</span>
        <div>
          <button className="font-bold text-blue-900 mr-4" onClick={() => setPage("Welcome")}>Welcome</button>
          <button className="font-bold text-blue-900 mr-4" onClick={() => setPage("Analysis")}>Analysis</button>
          <button className="font-bold text-blue-900" onClick={() => setPage("Chatbot")}>Chatbot</button>
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
