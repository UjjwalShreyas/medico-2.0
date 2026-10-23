import { useState, useRef, useEffect } from 'react';
import HomePage from './components/HomePage';
import DoctorPortal from './components/DoctorPortal';
import PatientPortal from './components/PatientPortal';
import ChatbotPage from './components/ChatbotPage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { id: "Home",    label: "Home",           icon: "⌂" },
    { id: "Doctor",  label: "Doctor Portal",  icon: "🩺" },
    { id: "Patient", label: "Patient Portal", icon: "🏥" },
    { id: "Chatbot", label: "Assistant",      icon: "💬" },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (id) => {
    setActiveTab(id);
    setMenuOpen(false);
  };

  const activeLabel = navItems.find(n => n.id === activeTab)?.label ?? "Menu";

  return (
    <div className="min-h-screen flex flex-col bg-[#EEDCC8] text-ruby font-sans">

      {/* Sticky Header */}
      <header className="bg-[#EEDCC8] border-b border-ruby/20 px-4 sm:px-8 py-3.5 flex justify-between items-center sticky top-0 z-50 shadow-xs">

        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => navigate("Home")}
        >
          <div className="w-8 h-8 rounded-lg bg-ruby text-[#EEDCC8] flex items-center justify-center font-bold text-base shadow-sm">
            M
          </div>
          <div>
            <span className="font-extrabold text-ruby text-lg tracking-tight">Medico</span>
            <span className="text-ruby/70 text-xs ml-1.5 hidden sm:inline font-medium">
              Clinical Scan Assistant
            </span>
          </div>
        </div>

        {/* Hamburger button + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            id="hamburger-btn"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-ruby/8 border border-ruby/20 hover:bg-ruby/15 transition-colors cursor-pointer group"
          >
            {/* Three-line hamburger icon */}
            <span className="flex flex-col gap-[5px] w-5">
              <span
                className={`block h-[2px] bg-ruby rounded-full transition-all duration-200 origin-center ${
                  menuOpen ? 'rotate-45 translate-y-[7px]' : ''
                }`}
              />
              <span
                className={`block h-[2px] bg-ruby rounded-full transition-all duration-200 ${
                  menuOpen ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`block h-[2px] bg-ruby rounded-full transition-all duration-200 origin-center ${
                  menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-ruby/80 hidden sm:inline">
              {activeLabel}
            </span>
          </button>

          {/* Dropdown menu */}
          <div
            className={`absolute right-0 mt-2 w-52 bg-[#FAF3EC] border border-ruby/20 rounded-2xl shadow-lg overflow-hidden transition-all duration-200 origin-top-right ${
              menuOpen
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id.toLowerCase()}`}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
                    activeTab === item.id
                      ? 'bg-ruby text-[#EEDCC8] shadow-sm'
                      : 'text-ruby hover:bg-ruby/10'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                  {activeTab === item.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#EEDCC8] opacity-80" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#EEDCC8]">
        {activeTab === "Home"    && <HomePage onNavigate={(tab) => navigate(tab)} />}
        {activeTab === "Doctor"  && <DoctorPortal />}
        {activeTab === "Patient" && <PatientPortal onConsultChatbot={() => navigate("Chatbot")} />}
        {activeTab === "Chatbot" && <ChatbotPage />}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-ruby/15 text-center text-xs text-ruby/70 bg-[#E4CCB2]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-medium">
          <p className="m-0">Medico Clinical Tool • Educational medical vision for tuberculosis, eye, and bone scans</p>
          <p className="m-0 text-ruby/60">Not for standalone diagnosis • Consult a certified physician</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
