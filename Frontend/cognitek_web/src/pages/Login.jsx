import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ScanFace, ArrowRight, UserPlus } from "lucide-react";
import Logo from "../components/Logo";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState("Sylens is ready");
  const [error, setError] = useState("");
  const [validation, setValidation] = useState({ username: null, password: null });
  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setOrbPos({ x, y });
  };

  const validateField = (name, value) => {
    if (name === "username") return value.length >= 3;
    if (name === "password") return value.length >= 6;
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setValidation({ ...validation, [name]: validateField(name, value) });
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validation.username || !validation.password) {
      setError("Please check your inputs.");
      return;
    }
    const res = login(formData.username, formData.password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError("User not found or incorrect password. Please register if new.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #e8e8e8, #f0f0f0, #f5f5f5)' }}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Background Layer: Soft Circuit Pattern */}
      <div className="absolute inset-0 bg-circuit opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.06)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Interactive Glowing Orb */}
      <div
        className="pointer-events-none absolute w-[400px] h-[400px] rounded-full bg-black/5 blur-[80px] transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${orbPos.x * 30 - 15}px, ${orbPos.y * 30 - 15}px)`,
          left: '50%',
          top: '50%',
          marginLeft: '-200px',
          marginTop: '-200px'
        }}
      />

      {/* Technical Glass Card */}
      <div className="tech-glass-card p-10 w-full max-w-[440px] relative z-10 mx-4 flex flex-col items-center">

        {/* Header Section */}
        <div className="w-full mb-8 text-center relative flex flex-col items-center">
          <div className="mb-5 animate-breathe">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-[2.4rem] font-extrabold tracking-[0.18em] mb-2 text-gradient-silver uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "0.18em" }}>
            CogniTek
          </h1>
          <p className="text-slate-500 text-[11px] tracking-[0.22em] mt-1 font-semibold uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {greeting} &nbsp;·&nbsp; Sylens Online
          </p>
        </div>

        {error && (
          <div className="w-full p-3 mb-6 bg-red-50 border border-red-300 text-red-600 text-xs font-mono rounded flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Username Input */}
          <div className="relative group">
            <input
              type="text"
              name="username"
              placeholder="USERNAME"
              className={`input-ghost text-sm tracking-wide ${validation.username === false ? 'border-red-500/50' : ''
                }`}
              value={formData.username}
              onChange={handleChange}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300">
              {validation.username === true && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>}
            </div>
          </div>

          {/* Password Input */}
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="PASSWORD"
              className={`input-ghost text-sm tracking-wide ${validation.password === false ? 'border-red-500/50' : ''
                }`}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Actions Row */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
            <Link to="/register" className="hover:text-slate-900 transition-colors flex items-center gap-1 group">
              <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" /> New User?
            </Link>
            <Link to="/forgot-password" className="hover:text-slate-900 transition-colors">
              Recover Access
            </Link>
          </div>

          {/* Primary Action */}
          <button
            type="submit"
            className="btn-tech flex items-center justify-center gap-2 group mt-4 mb-2 animate-pulse-glow"
          >
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "0.12em" }}>Initialize Session</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Spacer between form and divider */}
        <div style={{ height: '1.5rem' }} />

        {/* Divider */}
        <div className="relative w-full mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-[0.2em]">
            <span className="px-2 text-slate-400 bg-white font-bold">Alternative Protocol</span>
          </div>
        </div>

        {/* Gap before ticker */}
        <div style={{ height: '1.75rem' }} />

        {/* Micro-Feed Carousel */}
        <div className="w-full pt-3 pb-2 border-slate-200/70 overflow-hidden relative">
          <div className="whitespace-nowrap animate-scroll text-[10px] text-slate-400 flex gap-12 tracking-widest uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <span>✨ System Status: Optimal</span>
            <span>🚀 Update 2.4 </span>
            <span>🔒 Secure Enclave: Active</span>
            <span>📡 Network: Encrypted</span>
          </div>
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
