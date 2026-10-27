import { useState } from 'react';
import { api, errorMessage } from '../api';

const MAX_BYTES = 10 * 1024 * 1024;

const SCAN_TYPES = [
  {
    id: "Tuberculosis (Lung Cancer)",
    name: "Chest or Lung Scan",
    desc: "For persistent cough, chest discomfort, or respiratory X-rays",
    sampleFile: "/samples/chest_sample.jpg",
    sampleName: "chest_sample.jpg",
    sampleLabel: "Chest X-Ray Sample",
  },
  {
    id: "Eye Disease",
    name: "Eye or Vision Photo",
    desc: "For eye redness, cloudy vision, cataracts, or retinal scans",
    sampleFile: "/samples/eye_sample.jpg",
    sampleName: "eye_sample.jpg",
    sampleLabel: "Eye Photo Sample",
  },
  {
    id: "Bone Fracture",
    name: "Bone or Joint X-Ray",
    desc: "For arm, leg, wrist, or ankle injury radiographs",
    sampleFile: "/samples/bone_sample.jpg",
    sampleName: "bone_sample.jpg",
    sampleLabel: "Bone X-Ray Sample",
  },
];

function PatientPortal({ onBack, onConsultChatbot }) {
  const [patientName, setPatientName] = useState("Sarah");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedScan, setSelectedScan] = useState("Tuberculosis (Lung Cancer)");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = (e) => {
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

  const loadSample = async (samplePath, scanId, fileName) => {
    try {
      setError('');
      setResult(null);
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setImage(file);
      setPreviewUrl(samplePath);
      setSelectedScan(scanId);
    } catch {
      setError('Could not load the sample image.');
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please choose or upload a scan image first.');
      return;
    }
    if (image.size > MAX_BYTES) {
      setError('This image is larger than the 10 MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('model', selectedScan);
    formData.append('patient_name', patientName || 'Patient');
    formData.append('patient_id', 'PATIENT-SELF');

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/api/analyze/', formData);
      setResult({
        disease: res.data.detected_disease,
        report: res.data.medical_report,
        reportError: res.data.report_error,
        isValidImage: res.data.is_valid_image,
        validationError: res.data.validation_error,
        detectedType: res.data.detected_image_type,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-lemon text-ruby p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back Button */}
        {onBack && (
          <button
            id="patient-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-ruby/10 hover:bg-ruby/20 text-ruby font-bold text-xs border border-ruby/25 transition-all cursor-pointer group shadow-2xs"
            title="Back to Home"
          >
            <span className="transition-transform group-hover:-translate-x-1 font-bold">←</span>
            <span>Back to Home</span>
          </button>
        )}

        {/* Header */}
        <div className="pb-4 border-b border-ruby/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ruby tracking-tight">
              Patient Scan Checker
            </h1>
            <p className="text-xs text-ruby/70 font-medium mt-0.5">
              A private, educational tool to help you understand your medical scans in plain terms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ruby">First Name:</span>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="px-2.5 py-1 rounded bg-white border border-ruby/30 text-xs text-ruby focus:outline-none focus:border-ruby font-medium"
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="p-3.5 rounded-xl bg-amber-100 border border-amber-400 text-amber-950 text-xs leading-relaxed font-medium">
          <p className="font-bold text-amber-900 mb-0.5">Important Health Notice</p>
          This app provides general educational feedback only. If you are experiencing sudden severe chest pain, breathing difficulty, or an acute physical injury, please call emergency services (911 or your local equivalent) right away.
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-lg bg-red-100 border border-red-400 text-red-900 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Main 2-Step Interaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Step 1: Scan Upload */}
          <div className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-ruby">
              Step 1: Choose Your Image
            </h2>
            <p className="text-xs text-ruby/70 font-medium">
              Upload a picture of your scan, or click a demo sample to test:
            </p>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-ruby/30 hover:border-ruby rounded-xl cursor-pointer bg-white/70 hover:bg-white p-4 text-center transition-colors">
                <p className="text-sm font-bold text-ruby mb-0.5">Click to choose image</p>
                <p className="text-xs text-ruby/60 font-medium">PNG or JPG (under 10 MB)</p>
                <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
              </label>
            ) : (
              <div className="rounded-xl overflow-hidden border border-ruby/30 bg-black/5">
                <img src={previewUrl} alt="Patient preview" className="w-full h-40 object-contain bg-black/40" />
                <div className="p-2.5 bg-white flex justify-between items-center text-xs border-t border-ruby/15">
                  <span className="text-ruby font-medium truncate max-w-[180px]">{image?.name}</span>
                  <button
                    onClick={() => { setImage(null); setPreviewUrl(null); setResult(null); }}
                    className="text-red-700 hover:text-red-900 font-bold"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Scan Buttons */}
            <div>
              <p className="text-[11px] font-bold text-ruby/70 mb-1.5">Or try with an instant sample scan:</p>
              <div className="flex flex-wrap gap-1.5">
                {SCAN_TYPES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => loadSample(st.sampleFile, st.id, st.sampleName)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded bg-white hover:bg-ruby hover:text-lemon text-ruby border border-ruby/30 cursor-pointer transition-colors shadow-2xs"
                  >
                    {st.sampleLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: What scan is this? */}
          <div className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-ruby mb-1">
                Step 2: What Body Part Is This?
              </h2>
              <p className="text-xs text-ruby/70 font-medium mb-3">
                Select the area so the correct model reviews your image:
              </p>

              <div className="space-y-2">
                {SCAN_TYPES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedScan(st.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedScan === st.id
                        ? "bg-ruby/10 border-2 border-ruby text-ruby"
                        : "bg-white/80 border border-ruby/20 text-ruby/80 hover:border-ruby/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-ruby">{st.name}</p>
                      {selectedScan === st.id && (
                        <span className="text-[10px] text-lemon bg-ruby px-1.5 py-0.5 rounded font-bold">Selected</span>
                      )}
                    </div>
                    <p className="text-[11px] text-ruby/70 mt-0.5 font-medium">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !image}
              className="w-full mt-3 py-2.5 px-4 rounded-lg bg-ruby hover:bg-ruby-hover active:bg-ruby-dark disabled:opacity-40 disabled:cursor-not-allowed text-lemon font-bold text-sm transition-colors cursor-pointer shadow-xs"
            >
              {loading ? "Checking your scan…" : "Check My Scan Now →"}
            </button>
          </div>

        </div>

        {/* Results Box */}
        {result && (
          <div className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs space-y-4">
            <div className="pb-3 border-b border-ruby/15 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-ruby">Results Summary</h3>
                <p className="text-xs text-ruby/70 font-medium">Prepared for {patientName}</p>
              </div>
              <span className="text-xs font-bold text-lemon bg-ruby px-2.5 py-0.5 rounded">
                Preliminary Check
              </span>
            </div>

            {/* Unsuitable or Mismatched Image Warning */}
            {result.isValidImage === false ? (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-950 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none">⚠️</span>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Unsuitable or Mismatched Image
                    </h3>
                    {result.detectedType && (
                      <p className="text-[11px] font-semibold text-amber-800 mt-0.5">
                        Image recognized as: <span className="font-bold underline">{result.detectedType}</span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-amber-900 font-medium">
                  {result.validationError ||
                    "The uploaded image does not appear to be an authentic medical scan for this body part. Please select a genuine medical scan."}
                </p>
                <div className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg font-medium">
                  💡 <b>Tip:</b> Make sure you upload a real Chest X-Ray for respiratory checks, a close-up eye photo for vision checks, or a bone X-ray for fracture checks.
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-lg bg-white border border-ruby/20">
                  <p className="text-[11px] font-bold text-ruby/60 uppercase tracking-wide">Observed Marker</p>
                  <p className="text-base font-extrabold text-ruby mt-0.5">{result.disease}</p>
                </div>

                {result.report && (
                  <div className="p-4 rounded-lg bg-white border border-ruby/20 space-y-2">
                    <p className="text-xs font-bold text-ruby uppercase tracking-wide">
                      What Does This Mean?
                    </p>
                    <div className="text-xs text-ruby/90 leading-relaxed whitespace-pre-wrap font-medium">
                      {result.report}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Helpful Next Steps */}
            <div className="pt-3 border-t border-ruby/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-xs text-ruby/70 font-medium">
                Want to ask a follow-up question about this finding?
              </p>
              <button
                onClick={onConsultChatbot}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-ruby hover:bg-ruby-hover text-lemon font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Ask the Assistant in Chatbot →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PatientPortal;
