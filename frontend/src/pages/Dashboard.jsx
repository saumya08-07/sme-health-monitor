import { useState, useEffect, useRef } from "react";
import { submitReport, getReports } from "../api";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import ReactMarkdown from "react-markdown";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });
API.interceptors.request.use(req => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const INDUSTRIES = [
  "Retail", "Freelancer", "Technology", "Food & Beverage",
  "Manufacturing", "Service", "Healthcare", "Education",
  "Construction", "Logistics", "E-commerce", "Consulting",
  "Agriculture", "Textile", "Pharmacy"
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const RiskBadge = ({ level }) => {
  const s = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  const d = { green: "bg-green-400", yellow: "bg-yellow-400", red: "bg-red-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${s[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${d[level]}`}/>
      {level?.toUpperCase()}
    </span>
  );
};

const ScoreGauge = ({ score }) => {
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";
  const pct = (score / 100) * 283;
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
        <circle cx="80" cy="80" r="65" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${(score/100)*408} 408`}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 8px ${color})` }}/>
        <text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="700">{Math.round(score)}</text>
        <text x="80" y="92" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12">out of 100</text>
      </svg>
      <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Health Score</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === "Score" ? `${p.value}/100` : `₹${(p.value).toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard({ onLogout }) {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI financial advisor. Ask me anything about your business finances, health scores, or what actions to take this month." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [form, setForm] = useState({
    month: "June", year: 2026, day: 1,
    revenue: "", expenses: "", pending_payments: "",
    gst_filed: 1, outstanding_loans: 0,
    num_employees: 1, industry: "Retail", notes: ""
  });

  useEffect(() => { fetchReports(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    } catch {}
  };

  const handle = (e) => {
    const val = ["revenue","expenses","pending_payments","outstanding_loans","num_employees","day","year"]
      .includes(e.target.name) ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const submit = async () => {
    if (!form.revenue || !form.expenses) return alert("Revenue and expenses are required");
    setLoading(true);
    try {
      await submitReport({ ...form, gst_filed: parseInt(form.gst_filed) });
      await fetchReports();
      setShowForm(false);
      setTab("overview");
    } catch (err) {
      alert(err.response?.data?.detail || "Error submitting");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const context = selected ? `
        Latest report: ${selected.month} ${selected.year}
        Health Score: ${Math.round(selected.health_score)}/100
        Risk Level: ${selected.risk_level}
        Revenue: ₹${selected.revenue?.toLocaleString()}
        Expenses: ₹${selected.expenses?.toLocaleString()}
        Pending Payments: ₹${selected.pending_payments?.toLocaleString()}
        Profit: ₹${(selected.revenue - selected.expenses)?.toLocaleString()}
        GST Filed: ${selected.gst_filed ? "Yes" : "No"}
        Industry: ${selected.industry}
        Employees: ${selected.num_employees}
      ` : "No reports submitted yet.";

      const res = await API.post("/chat", {
        message: userMsg,
        context
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "I couldn't connect to the AI right now. Make sure Ollama is running."
      }]);
    }
    setChatLoading(false);
  };

  const chartData = [...reports].reverse().map(r => ({
    name: `${r.month.slice(0,3)} ${r.year}`,
    Score: Math.round(r.health_score),
    Revenue: r.revenue,
    Expenses: r.expenses,
    Profit: r.revenue - r.expenses,
    Pending: r.pending_payments
  }));

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "charts", label: "Analytics" },
    { id: "advisor", label: "AI Advisor" },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white">

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#050508]/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-white font-semibold">SME Health Monitor</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90">
              + New Report
            </button>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-300 text-sm transition">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">

        {/* Report Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass glow-blue rounded-3xl p-8 w-full max-w-2xl border border-indigo-500/20 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-bold">Submit Monthly Report</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter your business financials for AI analysis</p>
                </div>
                <button onClick={() => setShowForm(false)}
                  className="text-gray-600 hover:text-gray-400 transition">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Date section */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Report Period</p>
                <div className="grid grid-cols-3 gap-3">
                  <select name="month" onChange={handle} value={form.month}
                    className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm">
                    {MONTHS.map(m => <option key={m} value={m} className="bg-[#0d0d15]">{m}</option>)}
                  </select>
                  <input name="year" type="number" placeholder="Year" value={form.year} onChange={handle}
                    className="bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  <input name="day" type="number" placeholder="Day (1-31)" min="1" max="31" onChange={handle}
                    className="bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                </div>
              </div>

              {/* Business section */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Business Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <select name="industry" onChange={handle}
                    className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm">
                    {INDUSTRIES.map(i => <option key={i} value={i} className="bg-[#0d0d15]">{i}</option>)}
                  </select>
                  <input name="num_employees" type="number" placeholder="Number of Employees" onChange={handle}
                    className="bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                </div>
              </div>

              {/* Financials section */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Financial Data (₹)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Monthly Revenue *</label>
                    <input name="revenue" type="number" placeholder="e.g. 250000" onChange={handle}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Monthly Expenses *</label>
                    <input name="expenses" type="number" placeholder="e.g. 180000" onChange={handle}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Pending Payments (receivables)</label>
                    <input name="pending_payments" type="number" placeholder="e.g. 45000" onChange={handle}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Outstanding Loans</label>
                    <input name="outstanding_loans" type="number" placeholder="e.g. 100000" onChange={handle}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                  </div>
                </div>
              </div>

              {/* GST + Notes */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Compliance & Notes</p>
                <div className="grid grid-cols-2 gap-3">
                  <select name="gst_filed" onChange={handle}
                    className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm">
                    <option value={1} className="bg-[#0d0d15]">✓ GST Filed on Time</option>
                    <option value={0} className="bg-[#0d0d15]">✗ GST Delayed / Pending</option>
                  </select>
                  <input name="notes" placeholder="Any notes about this month..." onChange={handle}
                    className="bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                </div>
              </div>

              <button onClick={submit} disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-all text-sm disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing with AI... (up to 60 seconds)
                  </span>
                ) : "Analyze Business Health →"}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="glass rounded-3xl p-16 text-center max-w-lg glow-blue border border-indigo-500/20">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-white text-2xl font-bold mb-3">No reports yet</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">Submit your first monthly financial report to get an AI-powered health score, risk analysis, and actionable advice grounded in RBI guidelines.</p>
              <button onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold">
                Submit First Report →
              </button>
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && selected && (
              <div className="space-y-6">
                {/* Top stats */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: "Health Score", value: `${Math.round(selected.health_score)}/100`,
                      color: selected.health_score >= 70 ? "text-green-400" : selected.health_score >= 45 ? "text-yellow-400" : "text-red-400" },
                    { label: "Monthly Revenue", value: `₹${(selected.revenue/1000).toFixed(1)}K`, color: "text-indigo-400" },
                    { label: "Expenses", value: `₹${(selected.expenses/1000).toFixed(1)}K`, color: "text-purple-400" },
                    { label: "Net Profit", value: `₹${((selected.revenue-selected.expenses)/1000).toFixed(1)}K`,
                      color: selected.revenue > selected.expenses ? "text-green-400" : "text-red-400" },
                    { label: "Pending", value: `₹${(selected.pending_payments/1000).toFixed(1)}K`, color: "text-yellow-400" },
                  ].map(s => (
                    <div key={s.label} className="glass card-hover rounded-2xl p-5 border border-white/5">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Score gauge */}
                  <div className="glass rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center">
                    <ScoreGauge score={selected.health_score}/>
                    <div className="mt-4 text-center">
                      <RiskBadge level={selected.risk_level}/>
                      <p className="text-gray-500 text-sm mt-2">{selected.month} {selected.year}</p>
                      <p className="text-gray-600 text-xs mt-1">{selected.industry}</p>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-5 text-lg">Key Metrics</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Expense Ratio", value: `${((selected.expenses/selected.revenue)*100).toFixed(1)}%`,
                          good: selected.expenses/selected.revenue < 0.8, note: "< 80% is healthy" },
                        { label: "Profit Margin", value: `${(((selected.revenue-selected.expenses)/selected.revenue)*100).toFixed(1)}%`,
                          good: selected.revenue > selected.expenses, note: "Positive is good" },
                        { label: "Pending Ratio", value: `${((selected.pending_payments/selected.revenue)*100).toFixed(1)}%`,
                          good: selected.pending_payments/selected.revenue < 0.3, note: "< 30% is healthy" },
                        { label: "GST Status", value: selected.gst_filed ? "Filed ✓" : "Delayed ✗",
                          good: selected.gst_filed === 1, note: "Must be filed monthly" },
                        { label: "Employees", value: selected.num_employees || 1, good: true, note: "Team size" },
                      ].map(m => (
                        <div key={m.label} className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">{m.label}</p>
                            <p className="text-gray-600 text-xs">{m.note}</p>
                          </div>
                          <span className={`font-semibold text-sm ${m.good ? "text-green-400" : "text-red-400"}`}>
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-5 text-lg">Score Trend</h3>
                    {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#374151" fontSize={10} tickLine={false}/>
                          <YAxis stroke="#374151" fontSize={10} tickLine={false} domain={[0,100]}/>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Area type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2}
                            fill="url(#sg)" dot={{ fill: "#6366f1", r: 3 }}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                        Submit more reports to see trend
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="glass rounded-2xl p-8 border border-indigo-500/20 glow-blue">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">AI Financial Advisor</p>
                      <p className="text-gray-600 text-xs">Powered by Llama 3.2 + RBI/SIDBI Guidelines via RAG</p>
                    </div>
                    <div className="ml-auto">
                      <RiskBadge level={selected.risk_level}/>
                    </div>
                  </div>
                  <div className="text-gray-300 text-base leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{selected.ai_explanation}</ReactMarkdown>
                  </div>
                  {selected.notes && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-gray-600 text-xs uppercase tracking-wider mb-1">Your Notes</p>
                      <p className="text-gray-400 text-sm">{selected.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {tab === "timeline" && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-white text-2xl font-bold">Financial Timeline</h2>
                  <p className="text-gray-500 mt-1">Your complete history of monthly health checks</p>
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 to-transparent"/>
                  <div className="space-y-6">
                    {reports.map((r, i) => (
                      <div key={r.id} className="relative pl-16">
                        {/* Timeline dot */}
                        <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${
                          r.risk_level === "green" ? "border-green-500 bg-green-500/20" :
                          r.risk_level === "yellow" ? "border-yellow-500 bg-yellow-500/20" :
                          "border-red-500 bg-red-500/20"
                        }`}/>

                        <div className={`glass rounded-2xl p-6 border card-hover cursor-pointer transition ${
                          selected?.id === r.id ? "border-indigo-500/50 glow-blue" : "border-white/5"
                        }`} onClick={() => { setSelected(r); setTab("overview"); }}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-white font-bold text-lg">
                                {r.day ? `${r.day} ` : ""}{r.month} {r.year}
                              </p>
                              <p className="text-gray-500 text-sm">{r.industry} • {r.num_employees} employee{r.num_employees > 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-bold ${
                                r.health_score >= 70 ? "text-green-400" :
                                r.health_score >= 45 ? "text-yellow-400" : "text-red-400"
                              }`}>{Math.round(r.health_score)}</span>
                              <RiskBadge level={r.risk_level}/>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                              { label: "Revenue", value: `₹${(r.revenue/1000).toFixed(1)}K`, color: "text-indigo-400" },
                              { label: "Expenses", value: `₹${(r.expenses/1000).toFixed(1)}K`, color: "text-purple-400" },
                              { label: "Profit", value: `₹${((r.revenue-r.expenses)/1000).toFixed(1)}K`,
                                color: r.revenue > r.expenses ? "text-green-400" : "text-red-400" },
                              { label: "Pending", value: `₹${(r.pending_payments/1000).toFixed(1)}K`, color: "text-yellow-400" },
                            ].map(s => (
                              <div key={s.label} className="bg-white/3 rounded-xl p-3">
                                <p className="text-gray-600 text-xs mb-1">{s.label}</p>
                                <p className={`${s.color} font-semibold text-sm`}>{s.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Score bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/5 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${
                                r.risk_level === "green" ? "bg-green-500" :
                                r.risk_level === "yellow" ? "bg-yellow-500" : "bg-red-500"
                              }`} style={{ width: `${r.health_score}%` }}/>
                            </div>
                            <span className="text-gray-500 text-xs w-12 text-right">{Math.round(r.health_score)}/100</span>
                          </div>

                          {r.notes && (
                            <p className="text-gray-600 text-xs mt-3 italic">"{r.notes}"</p>
                          )}

                          <p className="text-indigo-400 text-xs mt-3">Click to view full analysis →</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CHARTS TAB */}
            {tab === "charts" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-white text-2xl font-bold">Analytics</h2>
                  <p className="text-gray-500 mt-1">Visual breakdown of your financial performance over time</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Health Score Trend */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-1">Health Score Over Time</h3>
                    <p className="text-gray-600 text-xs mb-5">Monthly AI-generated health score (0-100)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3"/>
                        <XAxis dataKey="name" stroke="#374151" fontSize={11} tickLine={false}/>
                        <YAxis stroke="#374151" fontSize={11} tickLine={false} domain={[0,100]}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2.5}
                          fill="url(#sg2)" dot={{ fill: "#6366f1", r: 5, strokeWidth: 2, stroke: "#050508" }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Revenue vs Expenses */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-1">Revenue vs Expenses</h3>
                    <p className="text-gray-600 text-xs mb-5">Monthly comparison in ₹</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3"/>
                        <XAxis dataKey="name" stroke="#374151" fontSize={11} tickLine={false}/>
                        <YAxis stroke="#374151" fontSize={11} tickLine={false}
                          tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend wrapperStyle={{ color: "#6b7280", fontSize: "12px" }}/>
                        <Bar dataKey="Revenue" fill="#6366f1" radius={[4,4,0,0]}/>
                        <Bar dataKey="Expenses" fill="#8b5cf6" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Profit Trend */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-1">Net Profit Trend</h3>
                    <p className="text-gray-600 text-xs mb-5">Revenue minus expenses each month</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3"/>
                        <XAxis dataKey="name" stroke="#374151" fontSize={11} tickLine={false}/>
                        <YAxis stroke="#374151" fontSize={11} tickLine={false}
                          tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2.5}
                          fill="url(#pg)" dot={{ fill: "#22c55e", r: 5, strokeWidth: 2, stroke: "#050508" }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pending Payments */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-semibold mb-1">Pending Payments</h3>
                    <p className="text-gray-600 text-xs mb-5">Outstanding receivables each month</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3"/>
                        <XAxis dataKey="name" stroke="#374151" fontSize={11} tickLine={false}/>
                        <YAxis stroke="#374151" fontSize={11} tickLine={false}
                          tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="Pending" fill="#eab308" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* AI ADVISOR TAB */}
            {tab === "advisor" && (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-white text-2xl font-bold">AI Financial Advisor</h2>
                  <p className="text-gray-500 mt-1">Ask anything about your business finances. Powered by Llama 3.2 + RBI Guidelines.</p>
                </div>

                {/* Context bar */}
                {selected && (
                  <div className="glass rounded-xl p-4 border border-indigo-500/20 mb-4 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
                    <p className="text-gray-400 text-sm">
                      Analyzing: <span className="text-white">{selected.month} {selected.year}</span>
                      {" — "}Score: <span className={selected.health_score >= 70 ? "text-green-400" : selected.health_score >= 45 ? "text-yellow-400" : "text-red-400"}>
                        {Math.round(selected.health_score)}/100
                      </span>
                      {" — "}<span className="text-gray-500">{selected.industry}</span>
                    </p>
                  </div>
                )}

                {/* Chat window */}
                <div className="glass rounded-2xl border border-white/5 flex flex-col" style={{ height: "60vh" }}>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                          </div>
                        )}
                        <div className={`max-w-lg rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                            : "glass border border-white/5 text-gray-300 rounded-tl-sm"
                        }`}>
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                          </svg>
                        </div>
                        <div className="glass border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}/>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}/>
                  </div>

                  {/* Input */}
                  <div className="border-t border-white/5 p-4 flex gap-3">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                      placeholder="Ask about your finances, risks, or what to do next..."
                      className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm"/>
                    <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50 transition hover:opacity-90">
                      Send →
                    </button>
                  </div>
                </div>

                {/* Quick questions */}
                <div className="mt-4">
                  <p className="text-gray-600 text-xs mb-3">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is my biggest financial risk this month?",
                      "How can I improve my health score?",
                      "Should I take a new loan right now?",
                      "What does my expense ratio mean?",
                      "How do I improve cash flow?",
                    ].map(q => (
                      <button key={q} onClick={() => { setChatInput(q); }}
                        className="glass border border-white/10 text-gray-400 text-xs px-3 py-2 rounded-lg hover:border-indigo-500/30 hover:text-gray-200 transition">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}