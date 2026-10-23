import React, { useState } from 'react';

function HomePage({ onNavigate }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const steps = [
    {
      num: "1",
      title: "Choose Your Portal",
      desc: "Select the Doctor Portal for clinical records and medical notes, or the Patient Portal for a simple summary in plain language.",
    },
    {
      num: "2",
      title: "Upload or Test a Scan",
      desc: "Upload a JPG/PNG image (chest X-ray, eye photo, or bone radiograph) or click 'Try Sample Scan' to test with our built-in images.",
    },
    {
      num: "3",
      title: "Read Findings & Guidance",
      desc: "View the detection result, confidence score, and clear next steps written to help you prepare questions for your physician.",
    },
  ];

  const models = [
    {
      name: "Tuberculosis & Chest Scan",
      type: "Chest X-Ray / Radiograph",
      desc: "Flags indicators of pulmonary infection and M. tuberculosis bacteria.",
      reliability: "High (0.90 validation score)",
      suitableFor: "Patients with persistent cough, fever, or chest radiographs.",
    },
    {
      name: "Eye Condition Screening",
      type: "Retinal & Ocular Photo",
      desc: "Identifies signs of Cataracts, Glaucoma, Uveitis, Bulging eyes, or Crossed eyes.",
      reliability: "Moderate (0.65 validation score)",
      suitableFor: "Vision checks, redness, or optical fundus images.",
    },
    {
      name: "Bone Fracture Detection",
      type: "Orthopedic Limb X-Ray",
      desc: "Searches for visible structural fracture lines in arm, leg, and joint X-rays.",
      reliability: "Experimental (0.36 validation score)",
      suitableFor: "Demonstration only; not for acute diagnostic use.",
    },
  ];

  const faqs = [
    {
      q: "Where do I get a medical scan to test?",
      a: "Both the Doctor and Patient portals feature one-click demo scan buttons (Chest X-Ray, Retinal Photo, and Bone X-Ray) that load instantly, so you can test the system without having your own files.",
    },
    {
      q: "How does the detection work?",
      a: "We run a YOLOv8 computer-vision model locally on the server. The model scans the image pixels, identifies visual markers learned from clinical datasets, and flags regions of interest.",
    },
    {
      q: "What do the confidence percentages mean?",
      a: "The percentage indicates statistical pattern match against model training data, not a medical certainty. Always confirm findings with a qualified physician.",
    },
    {
      q: "Is patient information saved or shared?",
      a: "No. Patient names and IDs are kept only in your local browser session and are never transmitted to external AI servers.",
    },
  ];

  return (
    <div className="flex-1 bg-[#EEDCC8] text-ruby">
      
      {/* Hero Header */}
      <section className="px-4 sm:px-8 pt-12 pb-14 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-ruby bg-ruby/10 border border-ruby/20 px-3 py-1 rounded-full mb-3">
            Clinical Image Assistant
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ruby tracking-tight leading-tight mb-3">
            Inspect medical scans with clear, simple explanations
          </h1>
          <p className="text-sm sm:text-base text-ruby/80 leading-relaxed mb-8 font-medium">
            An educational tool combining computer-vision detection with plain-language medical notes. Built for clinicians reviewing scans and patients seeking clearer answers.
          </p>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <button
              onClick={() => onNavigate("Doctor")}
              className="p-5 rounded-2xl bg-[#FAF3EC] border-2 border-ruby/20 hover:border-ruby hover:bg-[#FFFFFF] transition-all text-left cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ruby bg-ruby/10 px-2.5 py-0.5 rounded-full border border-ruby/20">
                  For Clinicians
                </span>
                <span className="text-sm font-bold text-ruby group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </div>
              <h2 className="text-base font-bold text-ruby mb-1">Doctor Portal</h2>
              <p className="text-xs text-ruby/80 leading-relaxed font-medium">
                Workstation for entering patient records, running specific YOLO models, and drafting clinical notes.
              </p>
            </button>

            <button
              onClick={() => onNavigate("Patient")}
              className="p-5 rounded-2xl bg-[#FAF3EC] border-2 border-ruby/20 hover:border-ruby hover:bg-[#FFFFFF] transition-all text-left cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ruby bg-ruby/10 px-2.5 py-0.5 rounded-full border border-ruby/20">
                  For Patients
                </span>
                <span className="text-sm font-bold text-ruby group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </div>
              <h2 className="text-base font-bold text-ruby mb-1">Patient Portal</h2>
              <p className="text-xs text-ruby/80 leading-relaxed font-medium">
                Simplified self-check: upload a scan, read what it means in plain English, and get questions for your doctor.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto border-t border-ruby/15">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-ruby mb-1">How to use this app</h2>
          <p className="text-xs text-ruby/70 font-medium">Follow these 3 simple steps to analyze an image</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs relative">
              <div className="w-8 h-8 rounded-lg bg-ruby text-[#EEDCC8] font-bold flex items-center justify-center text-sm mb-3 shadow-xs">
                {step.num}
              </div>
              <h3 className="text-sm font-bold text-ruby mb-1.5">{step.title}</h3>
              <p className="text-xs text-ruby/80 leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Scan Models */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto border-t border-ruby/15">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-ruby mb-1">Supported Scan Types & Capabilities</h2>
          <p className="text-xs text-ruby/70 font-medium">
            Each model was trained on distinct dataset types. Be sure to select the matching scan:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {models.map((m, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-[#FAF3EC] border border-ruby/20 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-ruby mb-1">{m.name}</h3>
                <p className="text-xs font-semibold text-ruby/70 mb-2">{m.type}</p>
                <p className="text-xs text-ruby/80 leading-relaxed mb-3 font-medium">{m.desc}</p>
              </div>

              <div className="pt-3 border-t border-ruby/15 text-[11px] space-y-1 text-ruby/70 font-medium">
                <p><span className="text-ruby font-bold">Suitable for:</span> {m.suitableFor}</p>
                <p><span className="text-ruby font-bold">Model Accuracy:</span> {m.reliability}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto border-t border-ruby/15 mb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ruby mb-1">Frequently asked questions</h2>
          <p className="text-xs text-ruby/70 font-medium">Quick answers about privacy, accuracy, and image requirements</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="rounded-xl bg-[#FAF3EC] border border-ruby/20 overflow-hidden transition-all shadow-xs"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex justify-between items-center text-sm font-bold text-ruby hover:text-ruby-dark transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-ruby/60 text-xs font-bold">{activeFaq === idx ? "▲" : "▼"}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-ruby/80 leading-relaxed border-t border-ruby/10 pt-3 font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default HomePage;
