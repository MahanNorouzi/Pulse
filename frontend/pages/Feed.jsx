import React, { useEffect, useState } from "react";

const API_BASE = "/Pulse/backend/index.php/api";

function detectRTL(text) {
  const rtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  let count = 0;
  for (const ch of text) if (rtl.test(ch)) count++;
  return text.length > 0 && count / text.length > 0.2;
}

export default function Feed() {
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState("auto");
  const [currentUser, setCurrentUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const fetchFeed = async () => {
      try {
        await loadCurrentUser();
        await loadTweets();
      } catch (e) {
        console.error("failed to load tweets", e);
      }
    };

    fetchFeed();

    return () => (mounted = false);
  }, []);

  // polling: refresh tweets every 5s
  useEffect(() => {
    const id = setInterval(() => {
      loadTweets().catch((e) => console.error("poll error", e));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // listen for profile follow changes (so follow/unfollow in Profile updates Feed state)
  useEffect(() => {
    function onProfileFollowChanged(e) {
      const detail = e?.detail;
      if (!detail) return;
      const { userId, follow } = detail;
      setFollowingIds((prev) => {
        const copy = new Set(prev);
        if (follow) copy.add(userId);
        else copy.delete(userId);
        return copy;
      });
      setFollowingCount((c) => (follow ? c + 1 : Math.max(0, c - 1)));
    }
    window.addEventListener("profile:followChanged", onProfileFollowChanged);
    return () =>
      window.removeEventListener(
        "profile:followChanged",
        onProfileFollowChanged,
      );
  }, []);

  // helper: load current user
  async function loadCurrentUser() {
    try {
      const me = await fetch(`${API_BASE}/me`, { credentials: "include" });
      if (me.ok) {
        const j = await me.json();
        const cu = j?.data ?? null;
        setCurrentUser(cu);
        // fetch follower/following counts for profile card
        if (cu?.id) {
          try {
            const f1 = await fetch(`${API_BASE}/users/${cu.id}/followers`, {
              credentials: "include",
            });
            if (f1.ok) {
              const fj = await f1.json();
              const fl = Array.isArray(fj)
                ? fj
                : Array.isArray(fj?.data)
                  ? fj.data
                  : [];
              setFollowersCount(Array.isArray(fl) ? fl.length : 0);
            }
            const f2 = await fetch(`${API_BASE}/users/${cu.id}/following`, {
              credentials: "include",
            });
            if (f2.ok) {
              const fj2 = await f2.json();
              const fl2 = Array.isArray(fj2)
                ? fj2
                : Array.isArray(fj2?.data)
                  ? fj2.data
                  : [];
              setFollowingCount(Array.isArray(fl2) ? fl2.length : 0);
            }
          } catch (e) {
            console.error("profile counts failed", e);
          }
          // load the list of users currentUser is following
          try {
            const ff = await fetch(`${API_BASE}/users/${cu.id}/following`, {
              credentials: "include",
            });
            if (ff.ok) {
              const fj = await ff.json();
              const list = Array.isArray(fj)
                ? fj
                : Array.isArray(fj?.data)
                  ? fj.data
                  : [];
              setFollowingIds(new Set(list.map((u) => u.id)));
            }
          } catch (e) {
            console.error("failed to load following list", e);
          }
        }
        return true;
      }
      // not authenticated -> redirect to login
      window.location.replace("/login");
      return false;
    } catch (e) {
      console.error("me fetch failed", e);
      return false;
    }
  }

  // helper: load tweets
  async function loadTweets() {
    try {
      const res = await fetch(`${API_BASE}/tweets`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      if (Array.isArray(list))
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTweets(list);
    } catch (e) {
      console.error("loadTweets failed", e);
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.replace("/login");
      } else {
        console.error("logout failed", await res.text());
        alert("Logout failed");
      }
    } catch (e) {
      console.error("logout error", e);
      alert("Logout failed");
    }
  }

  async function postTweet(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const payload = { content };
      const res = await fetch(`${API_BASE}/tweets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {}
      if (res.ok) {
        // reload feed from server to get canonical data (including likes)
        try {
          const ft = await fetch(`${API_BASE}/tweets`, {
            credentials: "include",
          });
          if (ft.ok) {
            const j = await ft.json();
            const list = Array.isArray(j)
              ? j
              : Array.isArray(j?.data)
                ? j.data
                : [];
            if (Array.isArray(list))
              list.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at),
              );
            setTweets(Array.isArray(list) ? list : []);
          }
        } catch (err) {
          console.error("failed to refresh feed", err);
        }
        setContent("");
        setDir("auto");
      } else {
        console.error("tweet failed", body || text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleDir = () =>
    setDir((d) => (d === "ltr" ? "rtl" : d === "rtl" ? "auto" : "ltr"));

  async function handleLike(tweet) {
    const id = tweet.id;
    try {
      if (tweet.is_liked) {
        const res = await fetch(`${API_BASE}/tweets/${id}/like`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          // refresh feed from server to get authoritative likes_count
          const ft = await fetch(`${API_BASE}/tweets`, {
            credentials: "include",
          });
          if (ft.ok) {
            const j = await ft.json();
            const list = Array.isArray(j)
              ? j
              : Array.isArray(j?.data)
                ? j.data
                : [];
            if (Array.isArray(list))
              list.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at),
              );
            setTweets(Array.isArray(list) ? list : []);
          }
        }
      } else {
        const res = await fetch(`${API_BASE}/tweets/${id}/like`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          // refresh feed from server to get authoritative likes_count
          const ft = await fetch(`${API_BASE}/tweets`, {
            credentials: "include",
          });
          if (ft.ok) {
            const j = await ft.json();
            const list = Array.isArray(j)
              ? j
              : Array.isArray(j?.data)
                ? j.data
                : [];
            if (Array.isArray(list))
              list.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at),
              );
            setTweets(Array.isArray(list) ? list : []);
          }
        }
      }
    } catch (e) {
      console.error("like/unlike failed", e);
    }
  }

  async function clearAllTweets() {
    if (!currentUser || currentUser.role !== "admin") return;
    if (!confirm("Delete ALL tweets? This is irreversible.")) return;
    try {
      const res = await fetch(`${API_BASE}/tweets/clear`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setTweets([]);
        alert("All tweets deleted");
      } else {
        console.error("clear failed", await res.text());
        alert("Clear failed");
      }
    } catch (e) {
      console.error("clear error", e);
      alert("Clear failed");
    }
  }

  async function handleDelete(tweet) {
    // let server decide authorization; user must be logged in
    if (!currentUser) return alert("Login required");
    const id = tweet.id;
    if (!confirm("Delete this tweet?")) return;
    try {
      const res = await fetch(`${API_BASE}/tweets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 403) {
        alert("Forbidden: you are not allowed to delete this tweet");
        return;
      }
      if (res.ok) {
        // refresh feed
        const ft = await fetch(`${API_BASE}/tweets`, {
          credentials: "include",
        });
        if (ft.ok) {
          const j = await ft.json();
          const list = Array.isArray(j)
            ? j
            : Array.isArray(j?.data)
              ? j.data
              : [];
          if (Array.isArray(list))
            list.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
          setTweets(Array.isArray(list) ? list : []);
        }
      } else {
        console.error("delete failed", await res.text());
        alert("Delete failed");
      }
    } catch (e) {
      console.error("delete error", e);
      alert("Delete failed");
    }
  }

  async function handleFollowToggle(userId, follow) {
    if (!currentUser) return window.location.replace("/login");
    try {
      const url = `${API_BASE}/users/${userId}/follow`;
      const res = await fetch(url, {
        method: follow ? "POST" : "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("follow toggle failed", await res.text());
        return;
      }
      setFollowingIds((prev) => {
        const copy = new Set(prev);
        if (follow) copy.add(userId);
        else copy.delete(userId);
        return copy;
      });
      // notify profile page (if open) to refresh counts/tweets
      try {
        window.dispatchEvent(
          new CustomEvent("profile:followChanged", {
            detail: { userId, follow },
          }),
        );
        window.dispatchEvent(new Event("profile:refresh"));
      } catch (e) {
        /* ignore if client doesn't support CustomEvent */
      }
      // if profile of that user is loaded in this page (unlikely) we could update counts
    } catch (e) {
      console.error("follow error", e);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-h4 font-semibold mb-4">Your Feed</h2>

      {currentUser && (
        <div className="mb-4 p-4 bg-card rounded-lg flex items-center gap-4">
          <img
            src={
              currentUser?.avatar || "/Pulse/backend/public/uploads/user.jpg"
            }
            alt={currentUser?.username}
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) =>
              (e.currentTarget.src = "/Pulse/backend/public/uploads/user.jpg")
            }
          />
          <div>
            <a
              href={`/profile/${currentUser.username}`}
              className="font-semibold"
            >
              {currentUser.name || currentUser.username}
            </a>
            <div className="text-muted text-small">@{currentUser.username}</div>
            <div className="text-small text-muted mt-1">
              {followersCount} followers · {followingCount} following
            </div>
            <div className="mt-2">
              <button
                onClick={handleLogout}
                className="px-2 py-1 rounded bg-surface border"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === "admin" && (
        <div className="mb-4">
          <button
            onClick={clearAllTweets}
            className="px-3 py-1 rounded bg-red-600 text-bg"
          >
            Clear all tweets (admin)
          </button>
        </div>
      )}

      <form onSubmit={postTweet} className="mb-6">
        <label htmlFor="tweet-content" className="block text-muted mb-2">
          Write a tweet
        </label>
        <div className="relative">
          <textarea
            id="tweet-content"
            dir={dir}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            rows={4}
            className="w-full p-4 rounded-xl bg-surface text-text border border-transparent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDir}
              aria-label="Toggle text direction"
              className="text-small text-muted"
            >
              {dir === "auto" ? "Auto" : dir.toUpperCase()}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 rounded bg-accent text-bg"
            >
              {loading ? "Posting…" : "Tweet"}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {tweets.length === 0 && (
          <div className="text-muted">No tweets yet.</div>
        )}

        {tweets.map((t) => (
          <article
            key={t.id}
            className="p-4 bg-card rounded-xl border border-white/5"
          >
            <div className="flex items-center gap-3 mb-1">
              <img
                src={
                  t.avatar ||
                  t.user?.avatar ||
                  "/Pulse/backend/public/uploads/user.jpg"
                }
                alt={t.user?.username || t.username}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) =>
                  (e.currentTarget.src =
                    "/Pulse/backend/public/uploads/user.jpg")
                }
              />
              <div className="text-small text-muted flex items-center gap-2">
                <a
                  href={`/profile/${t.user?.username || t.username}`}
                  className="font-medium"
                >
                  {t.user?.username || t.username || "unknown"}
                </a>
                {currentUser &&
                  (t.user?.id || t.user_id) !== currentUser.id &&
                  (followingIds.has(t.user?.id ?? t.user_id) ? (
                    <button
                      onClick={() =>
                        handleFollowToggle(t.user?.id ?? t.user_id, false)
                      }
                      className="text-small px-2 py-1 rounded border"
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleFollowToggle(t.user?.id ?? t.user_id, true)
                      }
                      className="text-small px-2 py-1 rounded bg-accent text-bg"
                    >
                      Follow
                    </button>
                  ))}
              </div>
            </div>
            <div className="text-text">
              {String(t.content || "")
                .split(/\r?\n/)
                .map((line, idx) => (
                  <div key={idx} dir={detectRTL(line) ? "rtl" : "ltr"}>
                    {line === "" ? <br /> : line}
                  </div>
                ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-muted text-small">
                {new Date(t.created_at || Date.now()).toLocaleString()}
              </div>
              <div className="flex items-center gap-3 text-small">
                <button
                  type="button"
                  onClick={() => handleLike(t)}
                  aria-pressed={!!t.is_liked}
                  aria-label={t.is_liked ? "Unlike" : "Like"}
                  className={`px-2 py-1 rounded ${t.is_liked ? "bg-red-600 text-bg" : "text-muted"}`}
                >
                  ♥ {t.likes_count || 0}
                </button>
                {currentUser &&
                  (currentUser.role === "admin" ||
                    currentUser.id === t.user_id ||
                    currentUser.id === t.user?.id) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      aria-label="Delete tweet"
                      className="px-2 py-1 rounded text-red-400 hover:opacity-80"
                    >
                      Delete
                    </button>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
