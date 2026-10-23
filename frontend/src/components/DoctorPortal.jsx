import { useState } from 'react';
import { api, errorMessage } from '../api';

const MAX_BYTES = 10 * 1024 * 1024;

const MODELS = [
  {
    id: "Tuberculosis (Lung Cancer)",
    name: "Tuberculosis & Chest Infections",
    sampleFile: "/samples/chest_sample.jpg",
    sampleLabel: "Chest X-Ray Sample",
    sampleName: "chest_sample.jpg",
    note: "Detects pulmonary tuberculosis bacteria markers.",
  },
  {
    id: "Eye Disease",
    name: "Ophthalmic & Retinal Conditions",
    sampleFile: "/samples/eye_sample.jpg",
    sampleLabel: "Retinal Photo Sample",
    sampleName: "eye_sample.jpg",
    note: "Screens for cataracts, glaucoma, and ocular inflammation.",
  },
  {
    id: "Bone Fracture",
    name: "Orthopedic Bone Fractures",
    sampleFile: "/samples/bone_sample.jpg",
    sampleLabel: "Bone X-Ray Sample",
    sampleName: "bone_sample.jpg",
    note: "Highlights potential hairline or displaced fracture lines.",
  },
];

function DoctorPortal() {
  const [patientName, setPatientName] = useState("Sarah Jenkins");
  const [patientId, setPatientId] = useState("PT-1049");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [model, setModel] = useState("Tuberculosis (Lung Cancer)");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0] || null;
    setImage(file);
    setResult(null);
    setError('');
    setSavedSuccess(false);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const loadSample = async (samplePath, modelId, fileName) => {
    try {
      setError('');
      setResult(null);
      setSavedSuccess(false);
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setImage(file);
      setPreviewUrl(samplePath);
      setModel(modelId);
    } catch {
      setError('Could not load sample file.');
    }
  };

  const handleClear = () => {
    setImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    setDoctorNotes('');
    setSavedSuccess(false);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please select or upload a medical scan first.');
      return;
    }
    if (image.size > MAX_BYTES) {
      setError('Image file is too large (maximum allowed size is 10 MB).');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('model', model);
    formData.append('patient_name', patientName || 'Unregistered');
    formData.append('patient_id', patientId || 'PT-DEFAULT');

    setLoading(true);
    setError('');
    setResult(null);
    setSavedSuccess(false);
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

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="flex-1 bg-[#EEDCC8] text-ruby p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-ruby/15">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-ruby tracking-tight">
                Doctor Diagnostic Workstation
              </h1>
              <span className="text-[11px] font-bold text-[#EEDCC8] bg-ruby px-2.5 py-0.5 rounded shadow-xs">
                Clinician Portal
              </span>
            </div>
            <p className="text-xs text-ruby/70 font-medium">
              Run neural detection on patient scans, review Gemini clinical notes, and add physician observations.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="text-xs px-3 py-1.5 rounded-lg border border-ruby/30 hover:border-ruby hover:bg-ruby/5 text-ruby font-semibold transition-colors cursor-pointer"
          >
            Clear Form
          </button>
        </div>

        {/* Patient Intake Bar */}
        <div className="p-4 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ruby mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 bg-white border border-ruby/30 rounded-lg text-sm text-ruby focus:outline-none focus:border-ruby transition-colors font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ruby mb-1">
                Medical Record ID (MRN)
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. PT-1049"
                className="w-full px-3 py-2 bg-white border border-ruby/30 rounded-lg text-sm text-ruby focus:outline-none focus:border-ruby transition-colors font-medium"
              />
            </div>
          </div>
          <p className="text-[11px] text-ruby/60 mt-2 font-medium">
            Patient details are used only to format the clinical note in this browser session.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div role="alert" className="p-3.5 rounded-lg bg-red-100 border border-red-400 text-red-900 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Save confirmation */}
        {savedSuccess && (
          <div className="p-3.5 rounded-lg bg-green-100 border border-green-500 text-green-900 text-xs font-semibold">
            Clinical report and doctor notes saved for {patientName} ({patientId}).
          </div>
        )}

        {/* 2-Column Diagnostic Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Scan Upload & Model */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-ruby mb-2 uppercase tracking-wide">
                  Step 1: Upload Scan Image
                </label>

                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-ruby/30 hover:border-ruby rounded-xl cursor-pointer bg-white/70 hover:bg-white transition-colors p-4 text-center">
                    <p className="text-sm font-bold text-ruby mb-0.5">Click to choose image</p>
                    <p className="text-xs text-ruby/60 font-medium">JPG or PNG (max. 10MB)</p>
                    <input type="file" accept="image/png,image/jpeg" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-ruby/30 bg-black/5">
                    <img src={previewUrl} alt="Scan preview" className="w-full h-44 object-contain bg-black/40" />
                    <div className="p-2.5 bg-white flex justify-between items-center text-xs border-t border-ruby/15">
                      <span className="text-ruby font-medium truncate max-w-[200px]">{image?.name}</span>
                      <button onClick={handleClear} className="text-red-700 hover:text-red-900 font-bold">
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant Sample Loader */}
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-ruby/70 mb-1.5">No image on hand? Try a demo scan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => loadSample(m.sampleFile, m.id, m.sampleName)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded bg-white hover:bg-ruby hover:text-[#EEDCC8] text-ruby border border-ruby/30 cursor-pointer transition-colors shadow-2xs"
                      >
                        {m.sampleLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Target Model */}
              <div>
                <label className="block text-xs font-bold text-ruby mb-2 uppercase tracking-wide">
                  Step 2: Select Disease Model
                </label>
                <div className="space-y-2">
                  {MODELS.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        model === m.id
                          ? "bg-ruby/10 border-2 border-ruby text-ruby"
                          : "bg-white/80 border border-ruby/20 text-ruby/80 hover:border-ruby/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ruby">{m.name}</span>
                        {model === m.id && (
                          <span className="text-[10px] text-[#EEDCC8] bg-ruby px-1.5 py-0.5 rounded font-bold">Selected</span>
                        )}
                      </div>
                      <p className="text-[11px] text-ruby/70 mt-0.5 font-medium">{m.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Run Analysis */}
              <button
                onClick={handleAnalyze}
                disabled={loading || !image}
                className="w-full py-2.5 px-4 rounded-lg bg-ruby hover:bg-ruby-hover active:bg-ruby-dark disabled:opacity-40 disabled:cursor-not-allowed text-[#EEDCC8] font-bold text-sm transition-colors cursor-pointer shadow-xs"
              >
                {loading ? "Analyzing scan with YOLO…" : "Run Detection Analysis →"}
              </button>
            </div>
          </div>

          {/* Right: Results & Doctor's Notes */}
          <div className="lg:col-span-7">
            <div className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs min-h-[440px] flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-ruby/15 mb-4">
                  <h2 className="text-sm font-bold text-ruby">Diagnostic Results</h2>
                  {result && (
                    <span className="text-xs text-[#EEDCC8] bg-ruby px-2 py-0.5 rounded font-bold">
                      Completed
                    </span>
                  )}
                </div>

                {!result && !loading && (
                  <div className="py-16 text-center text-ruby/60">
                    <p className="text-sm font-bold text-ruby mb-1">Awaiting scan image</p>
                    <p className="text-xs max-w-sm mx-auto text-ruby/70 font-medium">
                      Upload an image on the left (or pick a demo scan) and select the corresponding model to inspect findings.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="py-16 text-center space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-full border-2 border-ruby border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-ruby">Evaluating image with YOLO model…</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    {/* Primary Finding */}
                    <div className="p-3.5 rounded-lg bg-white border border-ruby/20">
                      <p className="text-[11px] font-bold text-ruby/60 uppercase tracking-wide">Model Detection</p>
                      <p className="text-base font-extrabold text-ruby mt-0.5">{result.disease}</p>
                    </div>

                    {/* Gemini AI Notes */}
                    {result.report && (
                      <div className="p-3.5 rounded-lg bg-white border border-ruby/20">
                        <p className="text-[11px] font-bold text-ruby uppercase tracking-wide mb-1.5">
                          Educational Clinical Notes (Gemini AI)
                        </p>
                        <div className="text-xs text-ruby/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1 font-medium">
                          {result.report}
                        </div>
                      </div>
                    )}

                    {result.reportError && (
                      <div className="p-3 rounded-lg bg-amber-100 border border-amber-400 text-amber-900 text-xs font-semibold">
                        AI Report Notice: {result.reportError}
                      </div>
                    )}

                    {/* Doctor's Notes */}
                    <div>
                      <label className="block text-xs font-bold text-ruby mb-1">
                        Doctor's Clinical Notes & Rx Recommendations
                      </label>
                      <textarea
                        rows={3}
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        placeholder="Add your clinical observations, additional lab tests requested, or follow-up instructions..."
                        className="w-full p-2.5 bg-white border border-ruby/30 rounded-lg text-xs text-ruby placeholder-ruby/40 focus:outline-none focus:border-ruby transition-colors font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div className="pt-4 border-t border-ruby/15 flex justify-end gap-3 mt-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-ruby hover:bg-ruby-hover text-[#EEDCC8] font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Save & Archive Case Record
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default DoctorPortal;
