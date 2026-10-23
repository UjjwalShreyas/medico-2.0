import { useState } from 'react';
import { api, errorMessage } from '../api';

const MAX_BYTES = 10 * 1024 * 1024; // keep in sync with MAX_UPLOAD_BYTES in the backend

const MODELS = [
  { id: "Tuberculosis (Lung Cancer)", name: "Tuberculosis (Lung Cancer)", desc: "Chest radiograph & pulmonary bacteria analysis" },
  { id: "Eye Disease", name: "Eye Disease", desc: "Retinal / ophthalmic condition classifier" },
  { id: "Bone Fracture", name: "Bone Fracture", desc: "Orthopedic radiographic fracture detection" },
];

function AnalysisPage({ patientName, patientId }) {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [model, setModel] = useState("Tuberculosis (Lung Cancer)");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0] || null;
    setImage(file);
    setResult(null);
    setError('');
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please select or upload a medical scan image first.');
      return;
    }
    if (image.size > MAX_BYTES) {
      setError('Selected image is too large (maximum allowed is 10 MB).');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('model', model);
    formData.append('patient_name', patientName || 'Guest Patient');
    formData.append('patient_id', patientId || 'PT-DEFAULT');

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/api/analyze/', formData);
      setResult({
        disease: res.data.detected_disease,
        report: res.data.medical_report,
        reportError: res.data.report_error,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-[#0d1c42] via-[#0a1533] to-[#060e22] text-white p-4 sm:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Patient Meta Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#101e42]/80 backdrop-blur-md border border-blue-700/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🩺</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Diagnostic Image Analysis</h2>
            </div>
            <p className="text-xs text-blue-200/70">
              Upload patient radiography or photography for automated YOLO lesion detection & AI report synthesis.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800/60">
              <span className="text-blue-300/70 mr-1.5">Patient:</span>
              <span className="font-semibold text-white">{patientName || "Guest Patient"}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800/60">
              <span className="text-blue-300/70 mr-1.5">ID:</span>
              <span className="font-semibold text-teal-300">{patientId || "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Diagnostic Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Upload & Model Config */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-[#101e42]/70 backdrop-blur-md border border-blue-700/30 space-y-5">
              
              {/* Image Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-2 uppercase tracking-wider">
                  Medical Image Scan
                </label>

                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-blue-600/40 hover:border-teal-400/60 rounded-xl cursor-pointer bg-blue-950/40 hover:bg-blue-950/70 transition-all p-4 text-center group">
                    <div className="w-12 h-12 mb-3 rounded-full bg-blue-900/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📷
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Click to upload scan</p>
                    <p className="text-xs text-blue-300/60">PNG or JPG (max. 10MB)</p>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-blue-700/40 bg-blue-950/50">
                    <img 
                      src={previewUrl} 
                      alt="Uploaded preview" 
                      className="w-full h-56 object-contain bg-black/40" 
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button 
                        onClick={handleClearImage}
                        className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-red-900/80 text-white text-xs backdrop-blur-sm transition-all"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="p-2.5 bg-blue-950/80 text-xs text-blue-200/80 truncate">
                      {image?.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-2 uppercase tracking-wider">
                  Target Detection Model
                </label>
                <div className="space-y-2">
                  {MODELS.map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        model === m.id 
                          ? "bg-teal-950/30 border-teal-400/60 text-white shadow-sm shadow-teal-500/10" 
                          : "bg-blue-950/40 border-blue-800/40 text-blue-200/80 hover:border-blue-600/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.name}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${model === m.id ? "border-teal-400 bg-teal-400" : "border-blue-600"}`}>
                          {model === m.id && <div className="w-1.5 h-1.5 bg-blue-950 rounded-full" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-300/60 mt-0.5">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <button
                className="w-full flex items-center justify-center gap-2 bg-teal-400 hover:bg-teal-300 active:scale-[0.99] text-blue-950 font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                onClick={handleSubmit}
                disabled={loading || !image}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-blue-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing Scan…</span>
                  </>
                ) : (
                  <>
                    <span>Submit Image for Detection</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Right Column: Diagnostic Results & Report */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[380px] p-6 rounded-2xl bg-[#101e42]/70 backdrop-blur-md border border-blue-700/30 flex flex-col">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-800/40">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📊</span> Diagnostic Findings
                </h3>
                {result && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    Analysis Completed
                  </span>
                )}
              </div>

              {!result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-blue-300/50">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-3xl">
                    🩺
                  </div>
                  <p className="text-sm font-medium text-blue-200/80">No scan analyzed yet</p>
                  <p className="text-xs text-blue-300/50 max-w-sm mt-1">
                    Upload a scan and select a model on the left to run detection and generate AI clinical notes.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-teal-400/20 border-t-teal-400 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Evaluating scan with YOLO & Gemini…</p>
                    <p className="text-xs text-blue-300/60 mt-1">Detecting anatomical regions and synthesizing report</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Primary Finding Badge */}
                  <div className="p-4 rounded-xl bg-blue-950/70 border border-blue-700/40">
                    <p className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider mb-1">
                      Detection Result
                    </p>
                    <p className="text-lg font-bold text-teal-300 flex items-center gap-2">
                      <span>🎯</span> {result.disease}
                    </p>
                  </div>

                  {/* Medical Report Text */}
                  {result.report && (
                    <div className="p-5 rounded-xl bg-blue-950/60 border border-blue-800/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📋</span>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Clinical AI Notes</h4>
                      </div>
                      <div className="text-sm text-blue-100/90 whitespace-pre-wrap leading-relaxed font-normal">
                        {result.report}
                      </div>
                    </div>
                  )}

                  {result.reportError && (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                      ⚠️ {result.reportError}
                    </div>
                  )}

                  {/* Legal/Safety Disclaimer */}
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-300/60">
                    ⚠️ <span className="font-medium text-blue-200">Clinical Notice:</span> These findings are generated for educational and reference purposes only. Consult a licensed radiologist or physician for formal diagnosis.
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AnalysisPage;
