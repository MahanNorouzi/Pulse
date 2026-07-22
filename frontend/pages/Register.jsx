import { useEffect, useReducer } from "react";
import { Link } from "react-router";
// Register can be rendered inline in the Login page via `onSwitchToLogin` prop

const API_BASE = "/Pulse/backend/index.php/api";

const Register = (props) => {
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
        return { ...state, showPassword: !state.showPassword };
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

  useEffect(() => {
    if (!username.trim()) {
      dispatch({ type: "setUsernameStatus", value: "idle" });
      return;
    }

    // use direct username lookup endpoint for immediate feedback
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      (async () => {
        try {
          dispatch({ type: "setChecking", value: true });
          const res = await fetch(
            `${API_BASE}/users/username/${encodeURIComponent(username)}`,
            { credentials: "include", signal: controller.signal },
          );

          if (res.ok) {
            // user exists
            dispatch({ type: "setUsernameStatus", value: "taken" });
          } else if (res.status === 404) {
            // not found -> available
            dispatch({ type: "setUsernameStatus", value: "available" });
          } else {
            dispatch({ type: "setUsernameStatus", value: "idle" });
          }
        } catch (err) {
          if (err.name === "AbortError") return;
          dispatch({ type: "setUsernameStatus", value: "idle" });
        } finally {
          dispatch({ type: "setChecking", value: false });
        }
      })();
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username]);

  const submit = async (e) => {
    e.preventDefault();

    dispatch({ type: "setMessage", value: null });

    if (usernameStatus === "taken") {
      return dispatch({
        type: "setMessage",
        value: { type: "error", text: "Please choose another username." },
      });
    }

    try {
      dispatch({ type: "setLoading", value: true });

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
          value: { type: "success", text: "Account created successfully 🎉" },
        });
        dispatch({ type: "resetFields" });
        // redirect to feed after successful registration
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
        value: { type: "error", text: "Network error. Please try again." },
      });
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="bg-card border border-accent/10 rounded-3xl p-8 shadow-[0_0_40px_rgba(201,168,106,0.08)]">
          <div className="text-center mb-8">
            <h1 className="text-[var(--text-h1)] text-text font-bold">
              Create Account
            </h1>

            <p className="text-muted text-[var(--text-small)] mt-2">
              Join Pulse and get started
            </p>
          </div>

          {message && (
            <div
              className={`mb-5 p-4 rounded-xl border ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="register-username"
                className="block text-muted mb-2"
              >
                Username
              </label>

              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(e) =>
                  dispatch({
                    type: "setField",
                    field: "username",
                    value: e.target.value,
                  })
                }
                placeholder="Choose a username"
                required
                className={`w-full px-4 py-3 rounded-xl bg-surface text-text border transition-all focus:outline-none focus:ring-2
                ${
                  usernameStatus === "taken"
                    ? "border-red-500 focus:ring-red-500/20"
                    : usernameStatus === "available"
                      ? "border-green-500 focus:ring-green-500/20"
                      : "border-transparent focus:border-accent focus:ring-accent/20"
                }`}
              />

              <div className="h-5 mt-2 text-sm">
                {checkingUsername && (
                  <span className="text-muted">Checking username...</span>
                )}
                {!checkingUsername && usernameStatus === "available" && (
                  <span className="text-green-500">✓ Username available</span>
                )}
                {!checkingUsername && usernameStatus === "taken" && (
                  <span className="text-red-500">Username already taken</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="register-name" className="block text-muted mb-2">
                Full Name
              </label>
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
                required
                className="w-full px-4 py-3 rounded-xl bg-surface text-text border border-transparent focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-muted mb-2">
                Email
              </label>
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
                required
                className="w-full px-4 py-3 rounded-xl bg-surface text-text border border-transparent focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="block text-muted mb-2"
              >
                Password
              </label>
              <div className="relative">
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
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface text-text border border-transparent focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "toggleShowPassword" })}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <p
                  className={
                    passwordChecks.length ? "text-green-500" : "text-muted"
                  }
                >
                  ✓ 8+ characters
                </p>
                <p
                  className={
                    passwordChecks.uppercase ? "text-green-500" : "text-muted"
                  }
                >
                  ✓ One uppercase letter
                </p>
                <p
                  className={
                    passwordChecks.number ? "text-green-500" : "text-muted"
                  }
                >
                  ✓ One number
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading || checkingUsername || usernameStatus === "taken"
              }
              className="w-full py-3 rounded-xl bg-accent text-bg font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* allow parent to control switch back to login when rendered inline */}
          {typeof props?.onSwitchToLogin === "function" ? (
            <p className="text-center text-small text-muted mt-4">
              Already have an account?{" "}
              <button
                onClick={() => props.onSwitchToLogin()}
                className="text-accent hover:underline"
              >
                Login
              </button>
            </p>
          ) : (
            <p className="text-center text-small text-muted mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:underline">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
