import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          setAuthed(true);
        } else {
          setAuthed(false);
          navigate("/login");
        }
      } catch (err) {
        if (!mounted) return;
        setAuthed(false);
        navigate("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading)
    return <div className="p-8 text-center">Checking authentication…</div>;
  if (!authed) return null;

  return <>{children}</>;
}
