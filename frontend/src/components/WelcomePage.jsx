import React, { useState } from 'react';

function WelcomePage({ onProceed }) {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-900 text-white">
      <h1 className="text-5xl font-bold mb-4">🩺 Welcome to MEDICO AI</h1>
      <p className="mb-4">
        <b>MEDICO AI</b> uses AI to detect diseases from medical images.<br />
        <span>Features include:</span><br />
        <ul className="list-disc ml-8">
          <li>AI-powered disease detection (YOLO)</li>
          <li>Medical report generation (Gemini AI)</li>
          <li>Interactive chatbot</li>
        </ul>
      </p>
      <input className="p-2 mb-2 text-black rounded" 
        type="text" placeholder="Enter Patient Name" 
        value={patientName} onChange={e => setPatientName(e.target.value)} />
      <input className="p-2 mb-2 text-black rounded" 
        type="text" placeholder="Enter Patient ID" 
        value={patientId} onChange={e => setPatientId(e.target.value)} />
      <button
        className="bg-teal-400 text-blue-900 px-6 py-2 rounded font-bold"
        onClick={() => onProceed({ patientName, patientId })}
      >
        Proceed to Analysis and Report
      </button>
    </div>
  );
}
export default WelcomePage;
