import React, { useState } from 'react';
import axios from 'axios';

function AnalysisPage({ patientName, patientId }) {
  const [image, setImage] = useState(null);
  const [model, setModel] = useState("Tuberculosis (Lung Cancer)");
  const [result, setResult] = useState({ disease: '', report: '' });
  const handleImageUpload = e => setImage(e.target.files[0]);
  const handleSubmit = async () => {
    let formData = new FormData();
    formData.append('image', image);
    formData.append('model', model);
    formData.append('patient_name', patientName);
    formData.append('patient_id', patientId);
    let res = await axios.post('http://127.0.0.1:8000/api/analyze/', formData);
    setResult({ disease: res.data.detected_disease, report: res.data.medical_report });
  };
  return (
    <div className="p-8 min-h-screen bg-blue-900 text-white">
      <h2 className="text-3xl mb-2">🩺 Analysis and Report</h2>
      <p><b>Patient Name:</b> {patientName}</p>
      <p><b>Patient ID:</b> {patientId}</p>
      <input type="file" accept="image/png,image/jpeg" 
        onChange={handleImageUpload} className="bg-white text-black p-2 rounded mb-2" />
      <select className="p-2 text-black rounded mb-2" value={model} onChange={e => setModel(e.target.value)}>
        <option>Tuberculosis (Lung Cancer)</option>
        <option>Eye Disease</option>
        <option>Bone Fracture</option>
      </select>
      <button className="bg-teal-400 text-blue-900 px-4 py-2 rounded" onClick={handleSubmit}>
        Submit Image
      </button>
      {result.disease && (
        <div className="mt-6 bg-teal-700 p-4 rounded shadow">
          <h3 className="text-xl mb-2">Diagnosis Result</h3>
          <p>{result.disease}</p>
          <h3 className="text-xl mt-2">Medical Report</h3>
          <p>{result.report}</p>
        </div>
      )}
    </div>
  );
}
export default AnalysisPage;
