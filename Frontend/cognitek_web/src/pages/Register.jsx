import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setOrbPos({ x, y });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const res = register(formData.username, formData.password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-dark)] font-sans text-slate-200"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-circuit opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.06)_0%,transparent_80%)] pointer-events-none"></div>

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

      <div className="tech-glass-card p-10 w-full max-w-[440px] relative z-10 mx-4 flex flex-col items-center">

        <div className="w-full mb-6 text-center relative flex flex-col items-center">
          <div className="mb-4">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider mb-2 text-gradient-silver uppercase">
            New Account
          </h1>
          <p className="text-slate-400 text-xs tracking-[0.2em] uppercase font-mono mt-1">
            Join Protocol
          </p>
        </div>

        {error && (
          <div className="w-full p-3 mb-6 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-mono rounded flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-4">
            {/* Username */}
            <input
              type="text"
              placeholder="USERNAME"
              className="input-ghost text-sm tracking-wide"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
            />
            {/* Password */}
            <input
              type="password"
              placeholder="PASSWORD"
              className="input-ghost text-sm tracking-wide"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            {/* Confirm Password */}
            <input
              type="password"
              placeholder="CONFIRM PASSWORD"
              className="input-ghost text-sm tracking-wide"
              required
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn-tech flex items-center justify-center gap-2 group mt-6 animate-pulse-glow"
          >
            <span>Create Profile</span>
            <UserPlus className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-mono text-slate-500">
          <span className="tracking-wide">Existing ID? </span>
          <Link to="/" className="text-slate-700 font-bold hover:text-slate-900 transition-colors ml-2 uppercase">Authenticate</Link>
        </div>
      </div>
    </div>
  );
}
