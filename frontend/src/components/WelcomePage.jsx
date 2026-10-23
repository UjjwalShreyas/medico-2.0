import { useState } from 'react';

function WelcomePage({ onProceed }) {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onProceed({ 
      patientName: patientName.trim() || "Guest Patient", 
      patientId: patientId.trim() || `PT-${Math.floor(1000 + Math.random() * 9000)}` 
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-65px)] bg-gradient-to-b from-[#0d1c42] via-[#0a1533] to-[#060e22] text-white px-4 py-12 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[200px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Main Card */}
        <div className="bg-[#101e42]/80 backdrop-blur-xl border border-blue-700/30 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-blue-950/80">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-950/70 border border-teal-400/30 text-3xl mb-4 shadow-inner shadow-teal-500/10">
              🩺
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-400">MEDICO AI</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-200/80 max-w-md mx-auto">
              Intelligent medical imaging analysis powered by deep learning and generative clinical notes.
            </p>
          </div>

          {/* Features - Clean Minimalist Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8">
            <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 rounded-xl bg-blue-950/50 border border-blue-800/40 hover:border-teal-500/30 transition-colors">
              <span className="text-xl">🔍</span>
              <div>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">YOLO Vision</p>
                <p className="text-xs text-blue-200/70">Disease Detection</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 rounded-xl bg-blue-950/50 border border-blue-800/40 hover:border-teal-500/30 transition-colors">
              <span className="text-xl">📋</span>
              <div>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Gemini AI</p>
                <p className="text-xs text-blue-200/70">Medical Reports</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 rounded-xl bg-blue-950/50 border border-blue-800/40 hover:border-teal-500/30 transition-colors">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Chatbot</p>
                <p className="text-xs text-blue-200/70">Clinical Queries</p>
              </div>
            </div>
          </div>

          {/* Patient Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patientName" className="block text-xs font-medium text-blue-200 mb-1.5 uppercase tracking-wider">
                Patient Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="patientName"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-950/80 border border-blue-700/50 rounded-xl text-white placeholder-blue-300/40 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="patientId" className="block text-xs font-medium text-blue-200 mb-1.5 uppercase tracking-wider">
                Patient ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </span>
                <input
                  id="patientId"
                  type="text"
                  placeholder="e.g. MED-8402"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-950/80 border border-blue-700/50 rounded-xl text-white placeholder-blue-300/40 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 bg-teal-400 hover:bg-teal-300 active:scale-[0.99] text-blue-950 font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 cursor-pointer"
            >
              <span>Proceed to Analysis and Report</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Minimalist Disclaimer */}
          <div className="mt-6 pt-5 border-t border-blue-800/40 text-center">
            <p className="text-[11px] text-blue-300/60 leading-relaxed">
              ⚠️ <span className="font-medium text-blue-200/80">Educational Demo:</span> Outputs are AI-generated and must not be used as a substitute for professional medical diagnosis.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
