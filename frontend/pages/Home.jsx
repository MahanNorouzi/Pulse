import { useEffect, useRef, useState } from "react";

import { Link } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";

const DEFAULT_AVATAR = "/Pulse/backend/public/uploads/user.jpg";

// Static content used by the product preview and footer.
const MOCKUP_NAV = ["Overview", "Community", "Messages", "Insights"];

const MOCKUP_STATS = [
  ["2,481", "Members"],
  ["18.4k", "Messages"],
  ["84%", "Activity"],
];

const ACTIVITY_BARS = [32, 46, 38, 61, 52, 72, 65, 88, 76, 94, 82, 100];

const COMMUNITY_CHANNELS = [
  ["# general", "Everyone"],
  ["# announcements", "Admins"],
  ["# design", "Design team"],
  ["# engineering", "Engineering"],
];

const INSIGHT_STATS = [
  ["84%", "Retention"],
  ["2.4k", "Members"],
  ["18.4k", "Messages"],
];

const FOOTER_GROUPS = [
  ["Product", ["Overview", "Communities", "Messaging", "Insights"]],
  ["Resources", ["Getting started", "Documentation", "Changelog"]],
  ["Company", ["About", "Careers"]],
  ["Legal", ["Privacy", "Terms"]],
];

// Handles loading the currently authenticated user.
function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const json = await res.json();
        const currentUser = json?.data ?? null;

        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("useCurrentUser fetch failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return [user, loading, setUser];
}

// Reusable SVG icons used throughout the page.
function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
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
    focusable: false,
    className,
  };

  const icons = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </>
    ),
    message: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.6 9.6 0 0 1-4-.9L3 21l1.8-4A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 5-7" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

// Shared button styles for the main actions.
function PrimaryButton({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`
        group inline-flex items-center justify-center gap-2
        rounded-pill bg-accent px-5 py-3
        font-text text-body font-semibold text-bg
        shadow-[0_8px_30px_rgba(201,168,106,0.16)]
        transition-all duration-200
        hover:-translate-y-0.5 hover:brightness-110
        active:translate-y-0 active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-accent/60
        ${className}
      `}
    >
      {children}
      <Icon
        name="arrow"
        size={17}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function SecondaryButton({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-pill border border-white/10
        bg-white/[0.035] px-5 py-3
        font-text text-body font-medium text-text
        backdrop-blur-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-accent/30
        hover:bg-accent/[0.07]
        active:translate-y-0 active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-accent/40
        ${className}
      `}
    >
      {children}
    </Link>
  );
}

// Handles the authenticated user menu in the header.
function HeaderAuth() {
  const [currentUser, loading] = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError(false);
    setLoggingOut(true);

    try {
      const res = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        window.location.replace("/login");
        return;
      }

      setLogoutError(true);
    } catch (error) {
      console.error("logout error", error);
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div
        className="h-10 w-28 animate-pulse rounded-pill bg-white/5"
        aria-hidden="true"
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="
            rounded-pill px-4 py-2.5
            font-text text-small font-medium text-muted
            transition-colors hover:text-text
            focus:outline-none focus:ring-2 focus:ring-accent/40
          "
        >
          Sign in
        </Link>

        <PrimaryButton to="/Register" className="px-4 py-2.5 text-small">
          Get started
        </PrimaryButton>
      </div>
    );
  }

  const displayName = currentUser.name || currentUser.username;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          setLogoutError(false);
          setOpen((value) => !value);
        }}
        className="
          flex items-center gap-2 rounded-pill
          border border-white/10 bg-white/[0.035]
          py-1.5 pl-1.5 pr-3
          transition
          hover:border-white/15 hover:bg-white/[0.06]
          focus:outline-none focus:ring-2 focus:ring-accent/40
        "
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
      >
        <img
          src={currentUser.avatar || DEFAULT_AVATAR}
          alt=""
          className="
            h-8 w-8 rounded-full object-cover
            ring-1 ring-white/10
          "
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_AVATAR;
          }}
        />

        <span
          className="
            hidden max-w-32 truncate
            font-text text-small font-medium text-text
            sm:inline
          "
        >
          {displayName}
        </span>
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-full z-50 mt-2 w-52
            overflow-hidden rounded-md
            border border-white/10 bg-card/95
            p-1.5 shadow-2xl backdrop-blur-xl
          "
          role="menu"
        >
          <Link
            to={`/profile/${currentUser.username}`}
            className="
              block rounded-sm px-3 py-2.5
              font-text text-small text-text
              transition hover:bg-white/5
              focus:outline-none focus:bg-white/5
            "
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>

          <Link
            to="/feed"
            className="
              block rounded-sm px-3 py-2.5
              font-text text-small text-text
              transition hover:bg-white/5
              focus:outline-none focus:bg-white/5
            "
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Feed
          </Link>

          <div className="my-1.5 h-px bg-white/5" aria-hidden="true" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="
              w-full rounded-sm px-3 py-2.5 text-left
              font-text text-small text-muted
              transition
              hover:bg-danger/10 hover:text-danger
              focus:outline-none focus:bg-danger/10
              focus:text-danger
              disabled:cursor-not-allowed disabled:opacity-50
            "
            role="menuitem"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>

          {logoutError && (
            <p
              className="
                px-3 pb-2 pt-1
                font-text text-small text-danger
              "
              role="alert"
            >
              Logout failed — try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Main navigation with responsive mobile behavior.
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-white/[0.06]
        bg-bg/85 backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-16 max-w-7xl
          items-center justify-between
          px-5 sm:px-6 lg:px-8
        "
      >
        <Link
          to="/"
          className="group flex items-center gap-2"
          aria-label="Pulse home"
          onClick={closeMobileMenu}
        >
          <span
            className="
              flex h-8 w-8 items-center justify-center
              rounded-sm bg-accent
              font-display text-lg font-bold text-bg
              transition-transform duration-200
              group-hover:rotate-3
            "
          >
            P
          </span>

          <span
            className="
              font-display text-lg font-semibold
              tracking-tight text-text
            "
          >
            Pulse
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary navigation"
        >
          <a
            href="#product"
            className="
              font-text text-small text-muted
              transition hover:text-text
              focus:outline-none focus:text-text
            "
          >
            Product
          </a>

          <a
            href="#features"
            className="
              font-text text-small text-muted
              transition hover:text-text
              focus:outline-none focus:text-text
            "
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="
              font-text text-small text-muted
              transition hover:text-text
              focus:outline-none focus:text-text
            "
          >
            How it works
          </a>
        </nav>

        <div className="hidden md:block">
          <HeaderAuth />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-sm border border-white/10
            text-muted transition
            hover:border-white/15 hover:text-text
            focus:outline-none focus:ring-2 focus:ring-accent/40
            md:hidden
          "
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <Icon name={mobileOpen ? "x" : "menu"} />
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="
            border-t border-white/[0.06]
            bg-surface px-5 py-5
            md:hidden
          "
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <a
              href="#product"
              onClick={closeMobileMenu}
              className="
                rounded-sm px-3 py-3
                font-text text-body text-text
                transition hover:bg-white/5
                focus:outline-none focus:bg-white/5
              "
            >
              Product
            </a>

            <a
              href="#features"
              onClick={closeMobileMenu}
              className="
                rounded-sm px-3 py-3
                font-text text-body text-text
                transition hover:bg-white/5
                focus:outline-none focus:bg-white/5
              "
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={closeMobileMenu}
              className="
                rounded-sm px-3 py-3
                font-text text-body text-text
                transition hover:bg-white/5
                focus:outline-none focus:bg-white/5
              "
            >
              How it works
            </a>

            <div className="mt-3 border-t border-white/5 pt-4">
              <HeaderAuth />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// Product interface preview shown on the landing page.
function ProductMockup() {
  return (
    <div
      className="
        relative overflow-hidden rounded-lg
        border border-white/10
        bg-card
        shadow-2xl
      "
    >
      {/* Browser-style header for the product preview. */}
      <div
        className="
          flex h-12 items-center justify-between
          border-b border-white/5
          bg-surface px-4
        "
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
        </div>

        <div
          className="
            hidden h-6 w-40 rounded-xs
            bg-white/5 sm:block
          "
        />

        <div className="h-6 w-6 rounded-full bg-accent/15" aria-hidden="true" />
      </div>

      <div className="grid min-h-[390px] md:grid-cols-[190px_1fr]">
        {/* Navigation shown inside the product preview. */}
        <aside
          className="
            hidden border-r border-white/5
            bg-surface p-4 md:block
          "
          aria-label="Workspace preview navigation"
        >
          <div className="mb-7">
            <div className="mb-4 flex items-center gap-2">
              <div
                className="
                  flex h-7 w-7 items-center justify-center
                  rounded-xs bg-accent
                  text-xs font-bold text-bg
                "
              >
                P
              </div>

              <div className="h-2 w-16 rounded-full bg-white/10" />
            </div>

            <div className="space-y-1.5">
              {MOCKUP_NAV.map((item, index) => (
                <div
                  key={item}
                  className={`
                    rounded-xs px-2.5 py-2
                    text-[10px]
                    ${index === 0 ? "bg-accent/10 text-accent" : "text-muted"}
                  `}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <div className="mb-3 h-2 w-16 rounded-full bg-white/10" />

            <div className="space-y-2">
              <div className="h-7 rounded-xs bg-white/[0.025]" />
              <div className="h-7 rounded-xs bg-white/[0.025]" />
              <div className="h-7 rounded-xs bg-white/[0.025]" />
            </div>
          </div>
        </aside>

        {/* Main content area of the product preview. */}
        <div className="p-5 sm:p-7">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p
                className="
                  mb-2 text-[10px]
                  uppercase tracking-[0.18em]
                  text-accent
                "
              >
                Community overview
              </p>

              <div className="h-4 w-32 rounded-full bg-white/10" />
            </div>

            <div
              className="
                hidden h-8 w-24 rounded-pill
                bg-accent/10 sm:block
              "
              aria-hidden="true"
            />
          </div>

          {/* Summary metrics for the preview. */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
            {MOCKUP_STATS.map(([value, label]) => (
              <div
                key={label}
                className="
                  rounded-sm border border-white/5
                  bg-surface p-3 sm:p-4
                "
              >
                <div
                  className="
                    text-sm font-semibold text-text
                    sm:text-base
                  "
                >
                  {value}
                </div>

                <div
                  className="
                    mt-1 text-[9px] text-muted
                    sm:text-[10px]
                  "
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Activity data is represented with simple bars. */}
          <div
            className="
              mb-4 rounded-sm
              border border-white/5
              bg-surface p-4
            "
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="h-2.5 w-20 rounded-full bg-white/10" />
                <div className="mt-2 h-2 w-12 rounded-full bg-white/5" />
              </div>

              <div className="h-5 w-16 rounded-pill bg-accent/10" />
            </div>

            <div
              className="
                flex h-24 items-end
                gap-1 sm:gap-1.5
              "
              aria-label="Illustrative activity chart"
            >
              {ACTIVITY_BARS.map((height, index) => (
                <div
                  key={index}
                  className="
                    flex-1 rounded-t-xs
                    bg-accent/70
                    transition-colors
                    hover:bg-accent
                  "
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          {/* Example messages displayed below the chart. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="
                rounded-sm border border-white/5
                bg-surface p-4
              "
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-accent/20" />
                <div className="h-2 w-16 rounded-full bg-white/10" />
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-white/5" />
                <div className="h-2 w-4/5 rounded-full bg-white/5" />
              </div>
            </div>

            <div
              className="
                rounded-sm border border-white/5
                bg-surface p-4
              "
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/10" />
                <div className="h-2 w-20 rounded-full bg-white/10" />
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-white/5" />
                <div className="h-2 w-3/5 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared layout for each feature section.
function Feature({ icon, eyebrow, title, text, children, reverse = false }) {
  return (
    <section
      className="
        border-t border-white/[0.06]
        px-5 py-20
        sm:px-6
        lg:px-8 lg:py-28
      "
    >
      <div
        className={`
          mx-auto grid max-w-7xl
          items-center gap-12
          lg:grid-cols-2 lg:gap-24
          ${reverse ? "lg:[&>*:first-child]:order-2" : ""}
        `}
      >
        <div>
          <div
            className="
              mb-5 inline-flex h-10 w-10
              items-center justify-center
              rounded-sm
              border border-accent/20
              bg-accent/10 text-accent
            "
          >
            <Icon name={icon} size={19} />
          </div>

          <p
            className="
              mb-3 font-text text-small
              font-semibold uppercase
              tracking-[0.16em] text-accent
            "
          >
            {eyebrow}
          </p>

          <h2
            className="
              max-w-xl font-display
              text-h2 font-semibold
              tracking-[-0.025em] text-text
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-5 max-w-lg
              font-text text-body
              leading-relaxed text-muted
            "
          >
            {text}
          </p>
        </div>

        <div>{children}</div>
      </div>
    </section>
  );
}

// Visual preview for the community feature.
function CommunityVisual() {
  return (
    <div
      className="
        rounded-lg border border-white/10
        bg-card p-4 shadow-xl
        transition-transform duration-300
        hover:-translate-y-1
        sm:p-5
      "
    >
      <div
        className="
          mb-4 flex items-center justify-between
          border-b border-white/5 pb-4
        "
      >
        <div>
          <div className="h-2.5 w-24 rounded-full bg-white/10" />
          <div className="mt-2 h-2 w-16 rounded-full bg-white/5" />
        </div>

        <div
          className="
            flex h-8 w-8 items-center justify-center
            rounded-full bg-accent/10 text-accent
          "
        >
          <Icon name="users" size={15} />
        </div>
      </div>

      <div className="space-y-2">
        {COMMUNITY_CHANNELS.map(([channel, role], index) => (
          <div
            key={channel}
            className={`
                flex items-center justify-between
                rounded-sm px-3 py-3
                ${
                  index === 1
                    ? "border border-accent/10 bg-accent/[0.06]"
                    : "bg-surface"
                }
              `}
          >
            <span
              className={`
                  font-text text-small
                  ${index === 1 ? "text-accent" : "text-text"}
                `}
            >
              {channel}
            </span>

            <span className="font-text text-[11px] text-muted">{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Visual preview for threaded messaging.
function MessagingVisual() {
  return (
    <div
      className="
        rounded-lg border border-white/10
        bg-card p-4 shadow-xl
        transition-transform duration-300
        hover:-translate-y-1
        sm:p-5
      "
    >
      <div
        className="
          mb-4 flex items-center gap-3
          border-b border-white/5 pb-4
        "
      >
        <div
          className="
            flex h-9 w-9 items-center justify-center
            rounded-full bg-accent/10 text-accent
          "
        >
          <Icon name="message" size={17} />
        </div>

        <div>
          <div className="h-2.5 w-28 rounded-full bg-white/10" />
          <div className="mt-2 h-2 w-20 rounded-full bg-white/5" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-md bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/10" />

            <div>
              <div className="h-2 w-20 rounded-full bg-white/10" />
              <div className="mt-1.5 h-1.5 w-12 rounded-full bg-white/5" />
            </div>
          </div>

          <div className="space-y-1.5 pl-9">
            <div className="h-2 w-full rounded-full bg-white/5" />
            <div className="h-2 w-4/5 rounded-full bg-white/5" />
          </div>
        </div>

        <div
          className="
            ml-8 rounded-md
            border border-accent/10
            bg-accent/[0.045] p-4
          "
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent/15" />

            <div>
              <div className="h-2 w-24 rounded-full bg-white/10" />
              <div className="mt-1.5 h-1.5 w-10 rounded-full bg-white/5" />
            </div>
          </div>

          <div className="space-y-1.5 pl-9">
            <div className="h-2 w-full rounded-full bg-white/5" />
            <div className="h-2 w-3/5 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Visual preview for community analytics.
function InsightsVisual() {
  return (
    <div
      className="
        rounded-lg border border-white/10
        bg-card p-5 shadow-xl
        transition-transform duration-300
        hover:-translate-y-1
      "
    >
      <div className="mb-7 flex items-center justify-between">
        <div>
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="mt-2 h-2 w-16 rounded-full bg-white/5" />
        </div>

        <div
          className="
            rounded-pill border border-accent/20
            bg-accent/10 px-3 py-1.5
            font-text text-[10px] text-accent
          "
        >
          +12.8%
        </div>
      </div>

      <div className="relative h-44">
        <div
          className="
            absolute inset-0
            flex flex-col justify-between
          "
          aria-hidden="true"
        >
          {[1, 2, 3, 4].map((line) => (
            <div key={line} className="h-px w-full bg-white/5" />
          ))}
        </div>

        <svg
          viewBox="0 0 500 180"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 150 C55 135 75 140 110 112 S170 125 205 95 S270 115 310 72 S370 95 405 48 S455 65 500 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-accent"
          />

          <path
            d="M0 150 C55 135 75 140 110 112 S170 125 205 95 S270 115 310 72 S370 95 405 48 S455 65 500 22 V180 H0Z"
            className="fill-accent/5"
          />
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {INSIGHT_STATS.map(([value, label]) => (
          <div key={label} className="rounded-sm bg-surface p-3">
            <div className="font-text text-sm font-semibold text-text">
              {value}
            </div>

            <div className="mt-1 font-text text-[10px] text-muted">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Single step used in the "How it works" section.
function Step({ number, title, text }) {
  return (
    <div className="relative">
      <div
        className="
          mb-5 flex h-10 w-10
          items-center justify-center
          rounded-full border border-accent/20
          bg-accent/10
          font-text text-small
          font-semibold text-accent
        "
      >
        {number}
      </div>

      <h3
        className="
          font-display text-h4
          font-semibold text-text
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-3 font-text text-small
          leading-relaxed text-muted
        "
      >
        {text}
      </p>
    </div>
  );
}

// Footer links and product information.
function Footer() {
  return (
    <footer
      className="
        border-t border-white/[0.06]
        bg-surface px-5 py-12
        sm:px-6 lg:px-8
      "
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {FOOTER_GROUPS.map(([heading, links]) => (
            <div key={heading}>
              <p
                className="
                  mb-4 font-text text-small
                  font-semibold text-text
                "
              >
                {heading}
              </p>

              <ul className="space-y-2.5">
                {links.map((label) => (
                  <li key={label}>
                    <span
                      className="
                        cursor-default
                        font-text text-small text-muted/60
                      "
                      title="Coming soon"
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="
            mt-12 flex flex-col gap-4
            border-t border-white/[0.06]
            pt-6
            sm:flex-row sm:items-center
            sm:justify-between
          "
        >
          <Link
            to="/"
            className="group flex items-center gap-2"
            aria-label="Pulse home"
          >
            <span
              className="
                flex h-7 w-7 items-center justify-center
                rounded-xs bg-accent
                font-display text-xs font-bold text-bg
                transition-transform duration-200
                group-hover:rotate-3
              "
            >
              P
            </span>

            <span
              className="
                font-display text-small
                font-semibold text-text
              "
            >
              Pulse
            </span>
          </Link>

          <p className="font-text text-[11px] text-muted">
            © 2026 Pulse · Concept UI · All data fictional
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main landing page.
export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-bg text-text">
      {/* Short announcement shown above the navigation. */}
      <div className="border-b border-white/[0.05] bg-surface px-5 py-2 text-center">
        <p className="font-text text-[11px] text-muted">
          Pulse is in concept stage · all data shown is fictional
        </p>
      </div>

      <Navbar />

      {/* Hero section. */}
      <section className="relative isolate overflow-hidden">
        {/* Decorative background glow for the hero. */}
        <div
          className="
            pointer-events-none absolute left-1/2 top-[-180px]
            h-[500px] w-[700px]
            -translate-x-1/2
            rounded-full
            bg-accent/[0.07]
            blur-[120px]
          "
          aria-hidden="true"
        />

        <div
          className="
            mx-auto max-w-7xl
            px-5 pb-16 pt-20
            sm:px-6 sm:pt-28
            lg:px-8 lg:pb-24 lg:pt-36
          "
        >
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="
                mb-7 inline-flex items-center gap-2
                rounded-pill
                border border-accent/15
                bg-accent/[0.06]
                px-3.5 py-2
              "
            >
              <span
                className="
                  h-1.5 w-1.5 rounded-full
                  bg-accent
                  shadow-[0_0_10px_rgba(201,168,106,0.8)]
                "
                aria-hidden="true"
              />

              <span
                className="
                  font-text text-[11px]
                  font-medium uppercase
                  tracking-[0.14em] text-accent
                "
              >
                Community infrastructure
              </span>
            </div>

            <h1
              className="
                font-display text-h1
                font-semibold
                leading-[1.08]
                tracking-[-0.04em]
                text-text
                sm:text-[3.5rem]
                lg:text-[4.5rem]
              "
            >
              Build communities
              <span className="block text-accent">that actually last.</span>
            </h1>

            <p
              className="
                mx-auto mt-7 max-w-2xl
                font-text text-body
                leading-relaxed text-muted
                sm:text-[1.075rem]
              "
            >
              Pulse gives communities the structure they need to communicate
              clearly, organize naturally, and stay engaged as they grow.
            </p>

            <div
              className="
                mt-9 flex flex-col
                justify-center gap-3
                sm:flex-row
              "
            >
              <PrimaryButton to="/Register">Start building</PrimaryButton>
              <SecondaryButton to="/login">Explore Pulse</SecondaryButton>
            </div>

            <p
              className="
                mt-5 font-text text-[11px]
                text-muted/70
              "
            >
              No noise. No endless feed chaos. Just better community
              infrastructure.
            </p>
          </div>
        </div>

        {/* Product preview shown below the hero content. */}
        <div
          id="product"
          className="
            scroll-mt-24
            px-5 pb-20
            sm:px-6
            lg:px-8 lg:pb-28
          "
        >
          <div className="mx-auto max-w-6xl">
            <div
              className="
                mb-3 flex items-center
                justify-between px-1
              "
            >
              <span
                className="
                  font-text text-[10px]
                  uppercase tracking-[0.16em]
                  text-muted
                "
              >
                Pulse workspace
              </span>

              <span className="font-text text-[10px] text-muted/60">
                Live preview
              </span>
            </div>

            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Short section introducing the main product ideas. */}
      <section
        id="features"
        className="
          border-y border-white/[0.06]
          bg-surface px-5 py-20
          sm:px-6
          lg:px-8 lg:py-24
        "
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p
              className="
                mb-3 font-text text-small
                font-semibold uppercase
                tracking-[0.16em] text-accent
              "
            >
              Built around people
            </p>

            <h2
              className="
                font-display text-h2
                font-semibold
                tracking-[-0.025em] text-text
              "
            >
              Structure without making your community feel corporate.
            </h2>

            <p
              className="
                mt-5 font-text text-body
                leading-relaxed text-muted
              "
            >
              Pulse focuses on the parts that actually matter: organization,
              context, and visibility.
            </p>
          </div>
        </div>
      </section>

      {/* Main product feature sections. */}
      <Feature
        icon="users"
        eyebrow="Communities"
        title="Everyone knows where they belong."
        text="Roles, channels, and permissions give every member a clear place in the community without turning the experience into an admin dashboard."
      >
        <CommunityVisual />
      </Feature>

      <Feature
        icon="message"
        eyebrow="Messaging"
        title="Conversations keep their context."
        text="Threaded discussions keep replies attached to the thing they're actually about, so important conversations don't disappear into a wall of messages."
        reverse
      >
        <MessagingVisual />
      </Feature>

      <Feature
        icon="chart"
        eyebrow="Insights"
        title="See the drift before people disappear."
        text="Pulse surfaces activity patterns so community owners can understand what's working, what is slowing down, and where engagement is changing."
      >
        <InsightsVisual />
      </Feature>

      {/* Explains the basic flow of using Pulse. */}
      <section
        id="how-it-works"
        className="
          border-t border-white/[0.06]
          bg-surface px-5 py-20
          sm:px-6
          lg:px-8 lg:py-28
        "
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p
              className="
                mb-3 font-text text-small
                font-semibold uppercase
                tracking-[0.16em] text-accent
              "
            >
              Simple by design
            </p>

            <h2
              className="
                font-display text-h2
                font-semibold
                tracking-[-0.025em] text-text
              "
            >
              From scattered conversations to a real community.
            </h2>
          </div>

          <div
            className="
              mt-14 grid gap-10
              md:grid-cols-3 md:gap-12
            "
          >
            <Step
              number="01"
              title="Create your space"
              text="Set up the structure your community actually needs, from channels to roles."
            />

            <Step
              number="02"
              title="Bring people together"
              text="Give members clear places to talk, collaborate, share, and build relationships."
            />

            <Step
              number="03"
              title="Understand what happens"
              text="Use community insights to see where conversations grow and where attention starts to fade."
            />
          </div>
        </div>
      </section>

      {/* Final call to action before the footer. */}
      <section
        id="cta"
        className="
          relative isolate overflow-hidden
          border-t border-white/[0.06]
          px-5 py-24 text-center
          sm:px-6
          lg:px-8 lg:py-32
        "
      >
        <div
          className="
            pointer-events-none absolute
            left-1/2 top-1/2
            h-[400px] w-[600px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            bg-accent/[0.06]
            blur-[110px]
          "
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl">
          <div
            className="
              mx-auto mb-6
              flex h-12 w-12
              items-center justify-center
              rounded-md
              border border-accent/20
              bg-accent/10
              text-accent
            "
          >
            <Icon name="plus" size={21} />
          </div>

          <h2
            className="
              font-display text-h2
              font-semibold
              tracking-[-0.03em] text-text
              sm:text-[2.75rem]
            "
          >
            Build something people want to come back to.
          </h2>

          <p
            className="
              mx-auto mt-5 max-w-xl
              font-text text-body
              leading-relaxed text-muted
            "
          >
            Give your community a place with enough structure to grow without
            losing the human part.
          </p>

          <div className="mt-8">
            <PrimaryButton to="/Register">Start building</PrimaryButton>
          </div>
        </div>
      </section>

      {/* Footer content and navigation. */}
      <Footer />
    </main>
  );
}
