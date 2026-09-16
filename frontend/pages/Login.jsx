import { useReducer } from "react";
import { useNavigate, Link } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";

const initialState = {
  email: "",
  password: "",
  loading: false,
  fieldError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };

    case "setLoading":
      return { ...state, loading: action.value };

    case "setFieldError":
      return { ...state, fieldError: action.value };

    case "reset":
      return initialState;

    default:
      return state;
  }
}

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
    spark: (
      <>
        <path d="m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3L12 3Z" />
        <path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),

    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

const Login = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { email, password, loading, fieldError } = state;
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setFieldError", value: null });

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let body = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        // Ignore invalid JSON responses.
      }

      // Successful login takes the user to the feed.
      if (res.ok && (body?.success === true || body?.success === undefined)) {
        navigate("/feed");
        return;
      }

      // Show the API error when authentication fails.
      const errMsg = body?.message || "Invalid credentials";

      dispatch({
        type: "setFieldError",
        value: errMsg,
      });
    } catch {
      dispatch({
        type: "setFieldError",
        value: "Network error. Please try again.",
      });
    } finally {
      dispatch({
        type: "setLoading",
        value: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Thin accent line at the top of the page. */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      {/* Minimal header with the Pulse brand. */}
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-accent text-bg transition-transform duration-300 group-hover:scale-[1.03]">
              <Icon name="spark" size={17} strokeWidth={2} />
            </div>

            <span className="text-lg font-semibold tracking-tight">Pulse</span>
          </Link>

          <span className="text-xs uppercase tracking-[0.16em] text-muted/50">
            Sign in
          </span>
        </div>
      </header>

      {/* Login content. */}
      <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
        {/* Soft background glow behind the form. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.035] blur-3xl" />

        <div className="relative w-full max-w-[440px]">
          {/* Page heading. */}
          <div className="mb-9 text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Icon name="spark" size={21} strokeWidth={1.7} />
            </div>

            <h1 className="text-h2 font-semibold tracking-tight text-text sm:text-h1">
              Welcome back.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-small leading-6 text-muted">
              Sign in to continue to your Pulse.
            </p>
          </div>

          {/* Login form. */}
          <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-7">
            <form onSubmit={submit} className="space-y-5" aria-live="polite">
              {/* Email field. */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Email
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <Icon name="mail" size={17} strokeWidth={1.7} />
                  </div>

                  <input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "email",
                        value: e.target.value,
                      })
                    }
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-surface pl-11 pr-4 text-sm text-text outline-none transition-all placeholder:text-muted/45 hover:border-white/[0.12] focus:border-accent/60 focus:bg-surface focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              {/* Password field. */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Password
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <Icon name="lock" size={17} strokeWidth={1.7} />
                  </div>

                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "password",
                        value: e.target.value,
                      })
                    }
                    required
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-surface pl-11 pr-4 text-sm text-text outline-none transition-all placeholder:text-muted/45 hover:border-white/[0.12] focus:border-accent/60 focus:bg-surface focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              {/* Authentication error. */}
              {fieldError && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm leading-5 text-red-300"
                >
                  {fieldError}
                </div>
              )}

              {/* Submit button. */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/70 bg-accent px-5 text-sm font-semibold text-bg shadow-[0_8px_30px_rgba(201,168,106,0.12)] transition-all hover:bg-accent/90 hover:shadow-[0_10px_35px_rgba(201,168,106,0.18)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{loading ? "Signing in..." : "Login"}</span>

                {!loading && <Icon name="arrow" size={15} strokeWidth={2} />}
              </button>
            </form>

            {/* Link to registration. */}
            <div className="mt-6 border-t border-white/[0.07] pt-6 text-center text-small">
              <span className="text-muted">Not a user? </span>

              <Link
                to="/Register"
                className="font-medium text-accent transition-colors hover:text-accent/80 hover:underline"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Small footer detail below the form. */}
          <div className="mt-8 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted/35">
            <span className="h-px w-8 bg-white/[0.08]" />
            <span>Pulse</span>
            <span className="h-px w-8 bg-white/[0.08]" />
          </div>

          <p className="mt-4 text-center text-[11px] text-muted/35">
            © 2026 Pulse. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
