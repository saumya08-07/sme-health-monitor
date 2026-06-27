import { useState } from "react";
import { login, register } from "../api";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    business_name: "", business_type: "retail"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isRegister) await register(form);
      const res = await login({ email: form.email, password: form.password });
      localStorage.setItem("token", res.data.access_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050508] flex hero-glow">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">SME Health</span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-gray-400 text-sm">AI-Powered Financial Intelligence</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Know your business<br/>
            <span className="gradient-text">health in seconds.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-12">
            Input your monthly financials. Get an AI-generated health score, 
            risk analysis, and actionable advice — grounded in RBI guidelines.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {["ML Risk Scoring", "RAG-Powered Insights", "RBI Guidelines", "Real-time Alerts"].map(f => (
              <span key={f} className="glass text-gray-300 text-sm px-4 py-2 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Accuracy", value: "99.8%" },
            { label: "Response Time", value: "<2s" },
            { label: "Guidelines", value: "RBI/SIDBI" },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-4">
              <p className="gradient-text text-2xl font-bold">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="glass glow-blue rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"/>
              <span className="text-white font-semibold">SME Health</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {isRegister ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              {isRegister ? "Start monitoring your business health" : "Sign in to your dashboard"}
            </p>

            <div className="space-y-3">
              {isRegister && (
                <>
                  <input name="name" placeholder="Full name" onChange={handle}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white/8 transition text-sm"/>
                  <input name="business_name" placeholder="Business name" onChange={handle}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  <select name="business_type" onChange={handle}
                    className="w-full bg-[#0d0d15] border border-white/10 text-gray-400 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm">
                    <option value="retail">Retail</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="service">Service</option>
                    <option value="manufacturing">Manufacturing</option>
                  </select>
                </>
              )}
              <input name="email" type="email" placeholder="Email address" onChange={handle}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
              <input name="password" type="password" placeholder="Password" onChange={handle}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button onClick={submit} disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing...
                </span>
              ) : isRegister ? "Create Account" : "Sign In"}
            </button>

            <p className="text-gray-600 text-sm text-center mt-6">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <span onClick={() => setIsRegister(!isRegister)}
                className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition">
                {isRegister ? "Sign in" : "Sign up"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}