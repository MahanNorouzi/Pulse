import { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        await loadCurrentUser();
        await loadTweets();
      } catch (error) {
        console.error("failed to load tweets", error);
      }
    };

    fetchFeed();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      loadTweets().catch((error) => console.error("poll error", error));
    }, 5000);
    return () => clearInterval(id);
  }, []);

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
      } catch {
        body = null;
      }
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
      } catch {
        return;
      }
      // if profile of that user is loaded in this page (unlikely) we could update counts
    } catch (e) {
      console.error("follow error", e);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {" "}
      <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,700px)_1fr] gap-6">
          {" "}
          {/* LEFT SIDEBAR */}{" "}
          <aside className="hidden lg:block">
            {" "}
            <div className="sticky top-6">
              {" "}
              <div className="mb-4">
                {" "}
                <h1 className="text-h3 font-bold">Pulse</h1>{" "}
              </div>{" "}
              {currentUser && (
                <div className="bg-card rounded-3xl p-6">
                  {" "}
                  <img
                    src={
                      currentUser?.avatar ||
                      "/Pulse/backend/public/uploads/user.jpg"
                    }
                    alt={currentUser?.username}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "/Pulse/backend/public/uploads/user.jpg")
                    }
                  />{" "}
                  <div className="mt-4">
                    {" "}
                    <a
                      href={`/profile/${currentUser.username}`}
                      className="font-semibold text-lg"
                    >
                      {" "}
                      {currentUser.name || currentUser.username}{" "}
                    </a>{" "}
                    <div className="text-muted text-small">
                      {" "}
                      @{currentUser.username}{" "}
                    </div>{" "}
                    <div className="mt-4 flex gap-6">
                      {" "}
                      <div>
                        {" "}
                        <div className="font-semibold">
                          {" "}
                          {followersCount}{" "}
                        </div>{" "}
                        <div className="text-small text-muted">
                          {" "}
                          Followers{" "}
                        </div>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <div className="font-semibold">
                          {" "}
                          {followingCount}{" "}
                        </div>{" "}
                        <div className="text-small text-muted">
                          {" "}
                          Following{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <button
                      onClick={handleLogout}
                      className=" mt-5 w-full h-11 rounded-full bg-surface hover:bg-white/5 "
                    >
                      {" "}
                      Logout{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              {currentUser?.role === "admin" && (
                <button
                  onClick={clearAllTweets}
                  className=" mt-4 w-full h-11 rounded-full bg-red-600 text-bg "
                >
                  {" "}
                  Clear Tweets{" "}
                </button>
              )}{" "}
            </div>{" "}
          </aside>{" "}
          {/* FEED */}{" "}
          <main className="min-w-0">
            {" "}
            <div className=" sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-white/5 mb-4 ">
              {" "}
              <div className="py-4 px-2">
                {" "}
                <h2 className="text-h4 font-semibold"> Home </h2>{" "}
              </div>{" "}
            </div>{" "}
            <form onSubmit={postTweet} className="bg-card rounded-3xl p-5 mb-6">
              {" "}
              <textarea
                id="tweet-content"
                dir={dir}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                rows={4}
                className=" w-full resize-none bg-transparent outline-none text-text text-[16px] "
              />{" "}
              <div className="flex justify-between items-center mt-4">
                {" "}
                <button
                  type="button"
                  onClick={toggleDir}
                  className="text-muted text-small"
                >
                  {" "}
                  {dir === "auto" ? "Auto" : dir.toUpperCase()}{" "}
                </button>{" "}
                <button
                  type="submit"
                  disabled={loading}
                  className=" h-11 px-5 rounded-full bg-accent text-bg font-medium "
                >
                  {" "}
                  {loading ? "Posting..." : "Post"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
            <div className="space-y-4">
              {" "}
              {tweets.length === 0 && (
                <div className="text-muted"> No tweets yet. </div>
              )}{" "}
              {tweets.map((t) => (
                <article
                  key={t.id}
                  className=" bg-card rounded-3xl p-5 transition-all hover:shadow-xl "
                >
                  {" "}
                  <div className="flex items-start justify-between">
                    {" "}
                    <div className="flex gap-3">
                      {" "}
                      <img
                        src={
                          t.avatar ||
                          t.user?.avatar ||
                          "/Pulse/backend/public/uploads/user.jpg"
                        }
                        alt={t.user?.username || t.username}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "/Pulse/backend/public/uploads/user.jpg")
                        }
                      />{" "}
                      <div>
                        {" "}
                        <div className="flex items-center gap-2 flex-wrap">
                          {" "}
                          <a
                            href={`/profile/${t.user?.username || t.username}`}
                            className="font-semibold"
                          >
                            {" "}
                            {t.user?.username || t.username || "unknown"}{" "}
                          </a>{" "}
                          {currentUser &&
                            (t.user?.id || t.user_id) !== currentUser.id &&
                            (followingIds.has(t.user?.id ?? t.user_id) ? (
                              <button
                                onClick={() =>
                                  handleFollowToggle(
                                    t.user?.id ?? t.user_id,
                                    false,
                                  )
                                }
                                className=" px-3 h-8 rounded-full bg-surface "
                              >
                                {" "}
                                Following{" "}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleFollowToggle(
                                    t.user?.id ?? t.user_id,
                                    true,
                                  )
                                }
                                className=" px-3 h-8 rounded-full bg-accent text-bg "
                              >
                                {" "}
                                Follow{" "}
                              </button>
                            ))}{" "}
                        </div>{" "}
                        <div className="text-muted text-small mt-1">
                          {" "}
                          {new Date(t.created_at || "").toLocaleString()}{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="mt-4 text-text leading-relaxed">
                    {" "}
                    {String(t.content || "")
                      .split(/\r?\n/)
                      .map((line, idx) => (
                        <div key={idx} dir={detectRTL(line) ? "rtl" : "ltr"}>
                          {" "}
                          {line === "" ? <br /> : line}{" "}
                        </div>
                      ))}{" "}
                  </div>{" "}
                  <div className="flex items-center gap-3 mt-5">
                    {" "}
                    <button
                      type="button"
                      onClick={() => handleLike(t)}
                      aria-pressed={!!t.is_liked}
                      className={` h-10 px-4 rounded-full ${t.is_liked ? "bg-red-600 text-bg" : "bg-surface text-muted"} `}
                    >
                      {" "}
                      ♥ {t.likes_count || 0}{" "}
                    </button>{" "}
                    {currentUser &&
                      (currentUser.role === "admin" ||
                        currentUser.id === t.user_id ||
                        currentUser.id === t.user?.id) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className=" h-10 px-4 rounded-full bg-surface text-red-400 "
                        >
                          {" "}
                          Delete{" "}
                        </button>
                      )}{" "}
                  </div>{" "}
                </article>
              ))}{" "}
            </div>{" "}
          </main>{" "}
          {/* RIGHT SIDEBAR removed per request */}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
