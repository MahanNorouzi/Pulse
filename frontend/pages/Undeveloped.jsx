import { useEffect } from "react";

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    spark: (
      <>
        <path d="m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3L12 3Z" />
        <path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — Pulse";
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Subtle top line */}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Header */}

      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-accent text-bg">
              <Icon name="spark" size={17} strokeWidth={2} />
            </div>

            <span className="text-lg font-semibold tracking-tight">Pulse</span>
          </a>

          <span className="text-xs text-muted">404</span>
        </div>
      </header>

      {/* Main */}

      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-5 py-20">
        <div className="w-full max-w-[620px] text-center">
          {/* 404 */}

          <div className="select-none text-[clamp(7rem,22vw,12rem)] font-semibold leading-none tracking-[-0.08em] text-white/[0.045]">
            404
          </div>

          {/* Icon */}

          <div className="-mt-8 sm:-mt-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Icon name="spark" size={24} strokeWidth={1.7} />
            </div>
          </div>

          {/* Copy */}

          <h1 className="mt-7 text-2xl font-semibold tracking-tight sm:text-3xl">
            This pulse hasn't started yet.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
            The page you're looking for isn't available yet. It might be
            somewhere on the roadmap, or maybe you just took a wrong turn.
          </p>

          {/* Action */}

          <div className="mt-8 flex justify-center">
            <a
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-accent/70 bg-accent px-5 text-sm font-medium text-bg shadow-sm transition hover:bg-accent/90 hover:brightness-105"
            >
              <Icon name="home" size={16} strokeWidth={2} />
              Back to Pulse
              <Icon name="arrow" size={15} strokeWidth={2} />
            </a>
          </div>

          {/* Small footer message */}

          <div className="mt-12 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted/40">
            <span className="h-px w-8 bg-white/[0.08]" />
            <span>Pulse</span>
            <span className="h-px w-8 bg-white/[0.08]" />
          </div>
        </div>
      </main>
    </div>
  );
}
