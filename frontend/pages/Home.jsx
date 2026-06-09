function Home() {
  return (
    <div className="min-h-screen bg-[#101214] text-[#f4f1eb]">
      {/* Navbar */}
      <nav className="border-b border-[#21252b]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <h1 className="text-2xl font-bold text-[#c9a86a]">Pulse</h1>

          <div className="flex items-center gap-4">
            <button className="text-[#a5a09a] transition hover:text-[#f4f1eb]">
              Login
            </button>

            <button className="rounded-lg bg-[#c9a86a] px-5 py-2 font-medium text-[#101214] transition hover:bg-[#d6b57a]">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-8 py-24 text-center">
        <span className="mb-4 rounded-full border border-[#8b6f47] bg-[#181b1f] px-4 py-2 text-sm text-[#c9a86a]">
          Connect • Share • Discover
        </span>

        <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Stay connected to what
          <span className="block text-[#c9a86a]">actually matters.</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-[#a5a09a]">
          Pulse helps you share moments, discover communities, and keep up with
          the people who matter most.
        </p>

        <div className="flex gap-4">
          <button className="rounded-xl bg-[#c9a86a] px-8 py-4 font-semibold text-[#101214] transition hover:bg-[#d6b57a]">
            Get Started
          </button>

          <button className="rounded-xl border border-[#2d3138] bg-[#181b1f] px-8 py-4 transition hover:bg-[#21252b]">
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-24 md:grid-cols-3">
        <div className="rounded-2xl border border-[#21252b] bg-[#181b1f] p-8">
          <div className="mb-4 text-3xl">⚡</div>

          <h3 className="mb-3 text-xl font-semibold text-[#c9a86a]">
            Real-Time Updates
          </h3>

          <p className="text-[#a5a09a]">
            Share thoughts, photos, and updates instantly with your community.
          </p>
        </div>

        <div className="rounded-2xl border border-[#21252b] bg-[#181b1f] p-8">
          <div className="mb-4 text-3xl">🌎</div>

          <h3 className="mb-3 text-xl font-semibold text-[#c9a86a]">
            Communities
          </h3>

          <p className="text-[#a5a09a]">
            Join conversations around the topics and interests you care about.
          </p>
        </div>

        <div className="rounded-2xl border border-[#21252b] bg-[#181b1f] p-8">
          <div className="mb-4 text-3xl">💬</div>

          <h3 className="mb-3 text-xl font-semibold text-[#c9a86a]">
            Private Messaging
          </h3>

          <p className="text-[#a5a09a]">
            Stay in touch with friends through secure, instant conversations.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#21252b] bg-[#181b1f] py-20">
        <div className="mx-auto max-w-4xl px-8 text-center">
          <h2 className="mb-4 text-4xl font-bold">Join the conversation.</h2>

          <p className="mb-8 text-[#a5a09a]">
            Create your account and start building your network today.
          </p>

          <button className="rounded-xl bg-[#c0392b] px-8 py-4 font-semibold text-white transition hover:opacity-90">
            Create Account
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
