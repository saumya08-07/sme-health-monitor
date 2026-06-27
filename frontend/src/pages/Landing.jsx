export default function Landing({ onGetStarted }) {
  const features = [
    {
      icon: "📊",
      title: "AI Health Score",
      desc: "Get a 0-100 financial health score every month powered by XGBoost ML model trained on real SME patterns."
    },
    {
      icon: "🧠",
      title: "RAG-Powered Advice",
      desc: "Advice grounded in RBI guidelines and SIDBI MSME reports — not generic tips, real regulatory context."
    },
    {
      icon: "📈",
      title: "Timeline Analytics",
      desc: "Track your financial health over months. See trends, spot patterns, catch problems before they become crises."
    },
    {
      icon: "💬",
      title: "AI Financial Chat",
      desc: "Ask your AI advisor anything about your business finances. Get instant, contextual answers."
    },
    {
      icon: "⚡",
      title: "Real-time Alerts",
      desc: "Instant warnings when your expense ratio spikes, GST is due, or cash flow looks dangerous."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      desc: "Your financial data never leaves your system. Local LLM, local database, zero third-party exposure."
    }
  ];

  const steps = [
    { step: "01", title: "Register your business", desc: "Create an account with your business details. Takes 30 seconds." },
    { step: "02", title: "Submit monthly data", desc: "Enter 6 numbers: revenue, expenses, pending payments, loans, employees, GST status." },
    { step: "03", title: "Get AI analysis", desc: "Our ML model scores your health and RAG pipeline generates RBI-grounded advice in seconds." },
    { step: "04", title: "Track over time", desc: "Build a financial history. See your health score trend and get proactive alerts." }
  ];

  const stats = [
    { value: "99.8%", label: "Model Accuracy" },
    { value: "<30s", label: "Analysis Time" },
    { value: "RBI/SIDBI", label: "Data Sources" },
    { value: "100%", label: "Private & Local" },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#050508]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">SME Health Monitor</span>
          </div>
          <button onClick={onGetStarted}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all">
            Get Started Free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-glow pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 border border-indigo-500/20">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
            <span className="text-indigo-300 text-sm">Powered by XGBoost + Llama + RBI Guidelines</span>
          </div>

          <h1 className="text-6xl font-bold leading-tight mb-6">
            Financial health monitoring<br/>
            <span className="gradient-text">built for Indian SMEs.</span>
          </h1>

          <p className="text-gray-400 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Enter your monthly numbers. Get an AI-powered health score, 
            regulatory-grounded advice, and a complete financial timeline — 
            all running locally on your machine.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button onClick={onGetStarted}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all glow-blue">
              Start Monitoring Free →
            </button>
            <button className="glass border border-white/10 text-gray-300 px-8 py-4 rounded-xl font-medium text-lg hover:border-white/20 transition">
              See Demo ↓
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-6 mt-20">
            {stats.map(s => (
              <div key={s.label} className="glass rounded-2xl p-6 border border-white/5">
                <p className="gradient-text text-3xl font-bold mb-1">{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl border border-white/5 p-1 glow-blue">
            <div className="bg-[#0a0a0f] rounded-2xl p-6">
              {/* Fake dashboard preview */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/50"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"/>
                <div className="w-3 h-3 rounded-full bg-green-500/50"/>
                <div className="ml-4 glass rounded-lg px-4 py-1 text-gray-600 text-xs flex-1 max-w-xs">
                  localhost:3000/dashboard
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Health Score", value: "78/100", color: "text-green-400" },
                  { label: "Revenue", value: "₹2.4L", color: "text-indigo-400" },
                  { label: "Expenses", value: "₹1.8L", color: "text-purple-400" },
                  { label: "Risk Level", value: "GREEN", color: "text-green-400" },
                ].map(c => (
                  <div key={c.label} className="glass rounded-xl p-4 border border-white/5">
                    <p className="text-gray-600 text-xs mb-1">{c.label}</p>
                    <p className={`${c.color} font-bold text-xl`}>{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="glass rounded-xl p-4 border border-indigo-500/20">
                <p className="text-indigo-400 text-xs mb-2">🧠 AI Financial Advisor</p>
                <p className="text-gray-400 text-sm">Your business shows strong financial health with a 78/100 score. Profit margin at 25% is excellent for retail. One action: collect ₹45,000 in pending payments before month end to avoid cash flow stress next quarter...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-bold text-white mb-4">Everything your business needs</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Built specifically for Indian SME owners who need clear, actionable financial intelligence without the jargon.</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="glass card-hover rounded-2xl p-6 border border-white/5">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-medium uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-bold text-white">From numbers to insights in 4 steps</h2>
          </div>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-start gap-6 glass rounded-2xl p-6 border border-white/5 card-hover">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="gradient-text font-bold text-sm">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-auto text-gray-700 text-2xl">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass glow-blue rounded-3xl p-12 border border-indigo-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">
              Know your business health<br/>
              <span className="gradient-text">starting today.</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Free, local, private. No subscriptions. No data sharing. 
              Just clear financial intelligence for your business.
            </p>
            <button onClick={onGetStarted}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all glow-blue">
              Get Started Free →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"/>
            <span className="text-gray-600 text-sm">SME Health Monitor — Built with FastAPI, XGBoost, LangChain, React</span>
          </div>
          <p className="text-gray-700 text-sm">Grounded in RBI & SIDBI Guidelines</p>
        </div>
      </div>
    </div>
  );
}