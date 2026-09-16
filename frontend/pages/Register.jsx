import { useEffect, useReducer } from "react";
import { Link } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";

const initialState = {
  username: "",
  name: "",
  email: "",
  password: "",
  showPassword: false,
  loading: false,
  checkingUsername: false,
  usernameStatus: "idle",
  message: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };

    case "setLoading":
      return { ...state, loading: action.value };

    case "setChecking":
      return { ...state, checkingUsername: action.value };

    case "setUsernameStatus":
      return { ...state, usernameStatus: action.value };

    case "setMessage":
      return { ...state, message: action.value };

    case "toggleShowPassword":
      return {
        ...state,
        showPassword: !state.showPassword,
      };

    case "resetFields":
      return {
        ...state,
        username: "",
        name: "",
        email: "",
        password: "",
        usernameStatus: "idle",
      };

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

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
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

    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a16.7 16.7 0 0 1-3.1 3.9" />
        <path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19a10.5 10.5 0 0 0 4-.8" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

const Register = (props) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    username,
    name,
    email,
    password,
    showPassword,
    loading,
    checkingUsername,
    usernameStatus,
    message,
  } = state;

  const usernameValid = /^[a-z0-9_]+$/.test(username);

  useEffect(() => {
    if (!username.trim() || !usernameValid) {
      dispatch({
        type: "setUsernameStatus",
        value: "idle",
      });
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      (async () => {
        try {
          dispatch({
            type: "setChecking",
            value: true,
          });

          const res = await fetch(
            `${API_BASE}/users/username/${encodeURIComponent(username)}`,
            {
              credentials: "include",
              signal: controller.signal,
            },
          );

          if (res.ok) {
            dispatch({
              type: "setUsernameStatus",
              value: "taken",
            });
          } else if (res.status === 404) {
            dispatch({
              type: "setUsernameStatus",
              value: "available",
            });
          } else {
            dispatch({
              type: "setUsernameStatus",
              value: "idle",
            });
          }
        } catch (err) {
          if (err.name === "AbortError") return;

          dispatch({
            type: "setUsernameStatus",
            value: "idle",
          });
        } finally {
          dispatch({
            type: "setChecking",
            value: false,
          });
        }
      })();
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username, usernameValid]);

  const submit = async (e) => {
    e.preventDefault();

    dispatch({
      type: "setMessage",
      value: null,
    });

    if (!usernameValid) {
      dispatch({
        type: "setMessage",
        value: {
          type: "error",
          text: "Username may contain only lowercase English letters, numbers, and underscores.",
        },
      });
      return;
    }

    if (usernameStatus === "taken") {
      dispatch({
        type: "setMessage",
        value: {
          type: "error",
          text: "Please choose another username.",
        },
      });
      return;
    }

    try {
      dispatch({
        type: "setLoading",
        value: true,
      });

      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          email,
          password,
          name,
        }),
      });

      const text = await res.text();

      let body = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }

      if (res.ok) {
        dispatch({
          type: "setMessage",
          value: {
            type: "success",
            text: "Account created successfully 🎉",
          },
        });

        dispatch({
          type: "resetFields",
        });

        window.location.replace("/feed");
      } else {
        dispatch({
          type: "setMessage",
          value: {
            type: "error",
            text:
              body?.message || "Unable to create account. Please try again.",
          },
        });
      }
    } catch {
      dispatch({
        type: "setMessage",
        value: {
          type: "error",
          text: "Network error. Please try again.",
        },
      });
    } finally {
      dispatch({
        type: "setLoading",
        value: false,
      });
    }
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const usernameInputClass =
    usernameStatus === "taken"
      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
      : usernameStatus === "available"
        ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/10"
        : "border-white/[0.08] hover:border-white/[0.12] focus:border-accent/60 focus:ring-accent/10";

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-accent text-bg transition-transform duration-300 group-hover:scale-[1.03]">
              <Icon name="spark" size={17} strokeWidth={2} />
            </div>

            <span className="text-lg font-semibold tracking-tight">Pulse</span>
          </Link>

          <span className="text-xs uppercase tracking-[0.16em] text-muted/50">
            Create account
          </span>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.035] blur-3xl" />

        <div className="relative w-full max-w-[460px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Icon name="spark" size={21} strokeWidth={1.7} />
            </div>

            <h1 className="text-h2 font-semibold tracking-tight text-text sm:text-h1">
              Create your Pulse.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-small leading-6 text-muted">
              Set up your account and join the conversation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-7">
            {message && (
              <div
                role="alert"
                className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-5 ${
                  message.type === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-danger/20 bg-danger/10 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label
                  htmlFor="register-username"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Username
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <span className="text-sm font-medium">@</span>
                  </div>

                  <input
                    id="register-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const sanitizedUsername = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "");

                      dispatch({
                        type: "setField",
                        field: "username",
                        value: sanitizedUsername,
                      });
                    }}
                    maxLength={30}
                    pattern="[a-z0-9_]+"
                    title="Use only lowercase English letters, numbers, and underscores."
                    placeholder="your_username"
                    autoComplete="username"
                    required
                    className={`h-12 w-full rounded-xl border bg-surface pl-10 pr-4 text-sm text-text outline-none transition-all placeholder:text-muted/40 focus:ring-2 ${usernameInputClass}`}
                  />
                </div>

                <div className="mt-2 min-h-5 text-xs">
                  {checkingUsername && (
                    <span className="text-muted">Checking availability...</span>
                  )}

                  {!checkingUsername && usernameStatus === "available" && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Icon name="check" size={13} strokeWidth={2} />
                      Username available
                    </span>
                  )}

                  {!checkingUsername && usernameStatus === "taken" && (
                    <span className="text-red-400">Username already taken</span>
                  )}

                  {!checkingUsername &&
                    usernameStatus === "idle" &&
                    username.length > 0 && (
                      <span className="text-muted/50">
                        a–z, 0–9, and _ only
                      </span>
                    )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Full name
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <Icon name="user" size={17} strokeWidth={1.7} />
                  </div>

                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "name",
                        value: e.target.value,
                      })
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-surface pl-11 pr-4 text-sm text-text outline-none transition-all placeholder:text-muted/40 hover:border-white/[0.12] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Email
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <Icon name="mail" size={17} strokeWidth={1.7} />
                  </div>

                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "email",
                        value: e.target.value,
                      })
                    }
                    placeholder="john@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-surface pl-11 pr-4 text-sm text-text outline-none transition-all placeholder:text-muted/40 hover:border-white/[0.12] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-small font-medium text-text"
                >
                  Password
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted/60 transition-colors group-focus-within:text-accent">
                    <Icon name="lock" size={17} strokeWidth={1.7} />
                  </div>

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      dispatch({
                        type: "setField",
                        field: "password",
                        value: e.target.value,
                      })
                    }
                    placeholder="Create password"
                    autoComplete="new-password"
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-surface pl-11 pr-12 text-sm text-text outline-none transition-all placeholder:text-muted/40 hover:border-white/[0.12] focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "toggleShowPassword",
                      })
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.05] hover:text-text"
                  >
                    <Icon
                      name={showPassword ? "eyeOff" : "eye"}
                      size={17}
                      strokeWidth={1.7}
                    />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
                  <div
                    className={
                      passwordChecks.length
                        ? "text-emerald-400"
                        : "text-muted/50"
                    }
                  >
                    {passwordChecks.length ? "✓" : "○"} 8+ characters
                  </div>

                  <div
                    className={
                      passwordChecks.uppercase
                        ? "text-emerald-400"
                        : "text-muted/50"
                    }
                  >
                    {passwordChecks.uppercase ? "✓" : "○"} Uppercase
                  </div>

                  <div
                    className={
                      passwordChecks.number
                        ? "text-emerald-400"
                        : "text-muted/50"
                    }
                  >
                    {passwordChecks.number ? "✓" : "○"} Number
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  checkingUsername ||
                  usernameStatus === "taken" ||
                  !usernameValid
                }
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/70 bg-accent px-5 text-sm font-semibold text-bg shadow-[0_8px_30px_rgba(201,168,106,0.12)] transition-all hover:bg-accent/90 hover:shadow-[0_10px_35px_rgba(201,168,106,0.18)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>

                {!loading && <Icon name="arrow" size={15} strokeWidth={2} />}
              </button>
            </form>

            <div className="mt-6 border-t border-white/[0.07] pt-6 text-center text-small">
              <span className="text-muted">Already have an account? </span>

              {typeof props?.onSwitchToLogin === "function" ? (
                <button
                  type="button"
                  onClick={() => props.onSwitchToLogin()}
                  className="font-medium text-accent transition-colors hover:text-accent/80 hover:underline"
                >
                  Login
                </button>
              ) : (
                <Link
                  to="/login"
                  className="font-medium text-accent transition-colors hover:text-accent/80 hover:underline"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

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

export default Register;
