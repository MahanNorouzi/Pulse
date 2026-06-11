import React from "react";

export default function Home() {
  return (
    <main className="bg-bg text-text font-sans overflow-hidden">
      {/* FAKE DATA BANNER */}
      <div className="w-full text-center text-small py-2 bg-card border-b border-white/5 text-muted">
        ⚠️ Concept UI — all data is fictional / placeholder
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-5 flex items-center justify-between">
          <span className="text-text font-semibold tracking-tight">Pulse</span>

          <div className="hidden md:flex gap-8 text-small text-muted">
            <button className="hover:text-text transition">Product</button>
            <button className="hover:text-text transition">Docs</button>
            <button className="hover:text-text transition">Pricing</button>
          </div>

          <button className="bg-accent text-bg px-5 py-2 rounded-full text-small font-medium hover:opacity-90 transition">
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative text-center px-6 md:px-8 pt-28 md:pt-40 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[-200px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[180px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-small uppercase tracking-[0.25em] text-muted">
            Community infrastructure
          </p>

          <h1 className="mt-6 text-h1 md:text-[4.5rem] leading-lh-tight font-semibold tracking-[-0.05em]">
            Build communities that don’t collapse.
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-body text-muted leading-lh-relaxed">
            Pulse is a structured communication system for communities, teams,
            and creators — designed as a concept UI with fictional data only.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <button className="bg-accent text-bg px-7 py-3 rounded-full font-medium hover:opacity-90 transition">
              Start Building
            </button>

            <button className="border border-white/10 text-text px-7 py-3 rounded-full hover:bg-white/5 transition">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCT VISUAL */}
      <section className="px-6 md:px-8 pb-24">
        <div className="mx-auto max-w-6xl rounded-[28px] md:rounded-[40px] bg-surface border border-white/5 p-4 md:p-6 shadow-[0_50px_150px_rgba(0,0,0,0.5)]">
          <div className="grid md:grid-cols-12 gap-6">
            {/* SIDEBAR */}
            <aside className="md:col-span-3 bg-card rounded-[24px] p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-3 w-28 bg-white/5 rounded" />
              </div>

              <div className="h-10 rounded-xl bg-white/5" />

              <div className="space-y-2">
                <div className="h-2 w-full bg-white/5 rounded" />
                <div className="h-2 w-4/5 bg-white/5 rounded" />
                <div className="h-2 w-3/5 bg-white/5 rounded" />
              </div>
            </aside>

            {/* MAIN */}
            <main className="md:col-span-9 bg-card rounded-[24px] p-5 space-y-5">
              <div className="flex justify-between text-small text-muted">
                <span>Overview</span>
                <span>Mock analytics</span>
              </div>

              <div className="h-40 rounded-[24px] bg-white/5" />

              <div className="grid grid-cols-2 gap-4">
                <div className="h-28 rounded-[24px] bg-white/5" />
                <div className="h-28 rounded-[24px] bg-white/5" />
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 md:px-8 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-h2 md:text-[3rem] font-semibold">
            Structure over noise.
          </h2>

          <p className="mt-4 text-muted max-w-xl mx-auto">
            Everything here is mock UI — no real users, no real data.
          </p>

          <div className="mt-14 grid md:grid-cols-3 gap-5 text-left">
            {[
              [
                "Communities",
                "Structured spaces with roles, channels, permissions.",
              ],
              ["Messaging", "Thread-based communication that stays readable."],
              ["Insights", "Fictional engagement analytics for UI demo only."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="bg-card border border-white/5 rounded-3xl p-6 hover:border-white/10 transition"
              >
                <h3 className="text-h4 font-semibold">{title}</h3>
                <p className="mt-3 text-muted text-small leading-lh-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-28 text-center">
        <h2 className="text-h2 md:text-[3rem] font-semibold">
          Ready to build something real?
        </h2>

        <p className="mt-4 text-muted">
          Start shaping your community in minutes.
        </p>

        <button className="mt-10 bg-accent text-bg px-8 py-3 rounded-full font-medium hover:opacity-90 transition">
          Launch Pulse
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-small text-muted">
        © 2026 Pulse — Concept UI (All data fake)
      </footer>
    </main>
  );
}
