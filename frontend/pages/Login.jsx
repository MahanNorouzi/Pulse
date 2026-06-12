import React, { useReducer } from "react";

const API_BASE = "/Pulse/backend/index.php/api";

const initialState = {
  email: "",
  password: "",
  result: null,
  loading: false,
  fieldError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setResult":
      return { ...state, result: action.value };
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

const Login = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { email, password, result, loading, fieldError } = state;

  const submit = async (e) => {
    e.preventDefault();

    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setResult", value: null });
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
      } catch (e) {
        // not JSON
      }

      // handle auth errors
      if (res.status === 401 || res.status === 422) {
        const errMsg = body?.message || "Invalid credentials";
        dispatch({ type: "setFieldError", value: errMsg });
      }

      dispatch({
        type: "setResult",
        value: { status: res.status, body, raw: text },
      });
    } catch (err) {
      dispatch({ type: "setResult", value: { error: String(err) } });
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div
          className="
            bg-card
            border
            border-accent/10
            rounded-3xl
            p-8
            shadow-[0_0_40px_rgba(201,168,106,0.08)]
          "
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-h1 text-text font-bold tracking-tight">
              Welcome Back
            </h1>

            <p className="text-muted text-small mt-2">
              Sign in to continue to Pulse
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5" aria-live="polite">
            <div>
              <label
                htmlFor="login-email"
                className="block text-small text-muted mb-2"
              >
                Email
              </label>

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
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-surface
                  text-text
                  placeholder:text-muted
                  border
                  border-transparent
                  focus:outline-none
                  focus:border-accent
                  focus:ring-2
                  focus:ring-accent/20
                  transition-all
                "
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-small text-muted mb-2"
              >
                Password
              </label>

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
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-surface
                  text-text
                  placeholder:text-muted
                  border
                  border-transparent
                  focus:outline-none
                  focus:border-accent
                  focus:ring-2
                  focus:ring-accent/20
                  transition-all
                "
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Forgot password"
                className="
                  text-small
                  text-accent
                  hover:opacity-80
                  transition
                "
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                py-3
                rounded-xl
                bg-accent
                text-bg
                font-semibold
                hover:brightness-110
                active:scale-[0.98]
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>

          {/* Response */}
          {fieldError && (
            <div className="mt-4 text-sm text-red-600">{fieldError}</div>
          )}

          {result && (
            <div
              className="
                mt-6
                rounded-xl
                bg-surface
                border
                border-accent/10
                p-4
                overflow-auto
              "
            >
              <pre className="text-small text-text whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <p className="text-center text-muted text-small mt-6">
          © 2026 Pulse. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
