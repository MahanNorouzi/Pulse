import { useEffect, useState } from "react";

const API_BASE = "/Pulse/backend/index.php/api";

const DEFAULT_AVATAR = "/Pulse/backend/public/uploads/user.jpg";

function detectRTL(text) {
  const rtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  let count = 0;

  for (const ch of text) {
    if (rtl.test(ch)) count++;
  }

  return text.length > 0 && count / text.length > 0.2;
}

// icons
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

    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),

    heart: (
      <path d="M20.8 8.6c0 5.4-8.8 10.4-8.8 10.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.4Z" />
    ),

    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 15H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    ),

    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    spark: (
      <>
        <path d="m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3L12 3Z" />
        <path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" />
      </>
    ),

    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
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

// get all posts
async function fetchTweets() {
  const res = await fetch(`${API_BASE}/tweets`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load tweets");
  }

  const data = await res.json();

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  if (Array.isArray(list)) {
    list.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  }

  return list;
}

export default function Feed() {
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingIds, setFollowingIds] = useState(new Set());

  // keep the feed in sync when a follow happens on a profile page
  useEffect(() => {
    function onProfileFollowChanged(e) {
      const detail = e?.detail;

      if (!detail) return;

      const { userId, follow } = detail;

      setFollowingIds((prev) => {
        const copy = new Set(prev);

        if (follow) {
          copy.add(userId);
        } else {
          copy.delete(userId);
        }

        return copy;
      });

      setFollowingCount((count) =>
        follow ? count + 1 : Math.max(0, count - 1),
      );
    }

    window.addEventListener("profile:followChanged", onProfileFollowChanged);

    return () => {
      window.removeEventListener(
        "profile:followChanged",
        onProfileFollowChanged,
      );
    };
  }, []);

  // load the logged-in user and their follow data
  async function loadCurrentUser() {
    try {
      const me = await fetch(`${API_BASE}/me`, {
        credentials: "include",
      });

      if (!me.ok) {
        window.location.replace("/login");
        return false;
      }

      const data = await me.json();
      const user = data?.data ?? null;

      setCurrentUser(user);

      if (!user?.id) {
        return true;
      }

      try {
        const [followersResponse, followingResponse] = await Promise.all([
          fetch(`${API_BASE}/users/${user.id}/followers`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/users/${user.id}/following`, {
            credentials: "include",
          }),
        ]);

        if (followersResponse.ok) {
          const data = await followersResponse.json();

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

          setFollowersCount(list.length);
        }

        if (followingResponse.ok) {
          const data = await followingResponse.json();

          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

          setFollowingCount(list.length);
          setFollowingIds(new Set(list.map((user) => user.id)));
        }
      } catch (error) {
        console.error("Profile data failed:", error);
      }

      return true;
    } catch (error) {
      console.error("me fetch failed:", error);
      return false;
    }
  }

  // get the latest posts
  async function loadTweets() {
    try {
      const list = await fetchTweets();
      setTweets(list);
    } catch (error) {
      console.error("loadTweets failed:", error);
    }
  }

  // load everything when the page opens
  useEffect(() => {
    async function initialize() {
      try {
        await loadCurrentUser();
        await loadTweets();
      } finally {
        setInitialLoading(false);
      }
    }

    initialize();
  }, []);

  // refresh the feed every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTweets().catch((error) => console.error("poll error:", error));
    }, 5000);

    return () => clearInterval(interval);
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
        alert("Logout failed");
      }
    } catch (error) {
      console.error("logout error:", error);
      alert("Logout failed");
    }
  }

  async function postTweet(e) {
    e.preventDefault();

    if (!content.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/tweets`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        console.error("tweet failed:", await res.text());
        return;
      }

      const list = await fetchTweets();

      setTweets(list);
      setContent("");
    } catch (error) {
      console.error("post error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(tweet) {
    try {
      const method = tweet.is_liked ? "DELETE" : "POST";

      const res = await fetch(`${API_BASE}/tweets/${tweet.id}/like`, {
        method,
        credentials: "include",
      });

      if (!res.ok) return;

      const list = await fetchTweets();
      setTweets(list);
    } catch (error) {
      console.error("like/unlike failed:", error);
    }
  }

  async function handleDelete(tweet) {
    if (!currentUser) {
      alert("Login required");
      return;
    }

    if (!confirm("Delete this post?")) return;

    try {
      const res = await fetch(`${API_BASE}/tweets/${tweet.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 403) {
        alert("You are not allowed to delete this post.");
        return;
      }

      if (!res.ok) {
        alert("Delete failed");
        return;
      }

      const list = await fetchTweets();
      setTweets(list);
    } catch (error) {
      console.error("delete error:", error);
      alert("Delete failed");
    }
  }

  async function clearAllTweets() {
    if (!currentUser || currentUser.role !== "admin") {
      return;
    }

    if (!confirm("Delete ALL posts? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tweets/clear`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setTweets([]);
      } else {
        alert("Clear failed");
      }
    } catch (error) {
      console.error("clear error:", error);
      alert("Clear failed");
    }
  }

  async function handleFollowToggle(userId, follow) {
    if (!currentUser) {
      window.location.replace("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/follow`, {
        method: follow ? "POST" : "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("follow failed:", await res.text());
        return;
      }

      setFollowingIds((prev) => {
        const copy = new Set(prev);

        if (follow) {
          copy.add(userId);
        } else {
          copy.delete(userId);
        }

        return copy;
      });

      setFollowingCount((count) =>
        follow ? count + 1 : Math.max(0, count - 1),
      );

      window.dispatchEvent(
        new CustomEvent("profile:followChanged", {
          detail: {
            userId,
            follow,
          },
        }),
      );

      window.dispatchEvent(new Event("profile:refresh"));
    } catch (error) {
      console.error("follow error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* mobile header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-bg/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent text-bg">
              <Icon name="spark" size={16} strokeWidth={2} />
            </div>

            <span className="font-semibold tracking-tight">Pulse</span>
          </a>

          {currentUser && (
            <a href={`/profile/${currentUser.username}`}>
              <img
                src={currentUser.avatar || DEFAULT_AVATAR}
                alt={currentUser.username}
                className="h-9 w-9 rounded-full border border-white/10 object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-[1380px]">
        {/* desktop sidebar */}
        <aside className="hidden w-[250px] shrink-0 lg:block">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-7">
            <a href="/" className="mb-10 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-accent text-bg">
                <Icon name="spark" size={17} strokeWidth={2} />
              </div>

              <span className="text-lg font-semibold tracking-tight">
                Pulse
              </span>
            </a>

            <nav className="space-y-1">
              <a
                href=""
                className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.06] bg-surface px-3 text-sm font-medium text-text"
              >
                <Icon name="home" size={18} />
                Home
              </a>

              <a
                href="/notfound"
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:border-white/[0.06] hover:bg-surface hover:text-text"
              >
                <Icon name="users" size={18} />
                People
              </a>
            </nav>

            <div className="flex-1" />

            {currentUser && (
              <div className="border-t border-white/[0.08] pt-5">
                <a
                  href={`/profile/${currentUser.username}`}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-white/[0.06] hover:bg-surface"
                >
                  <img
                    src={currentUser.avatar || DEFAULT_AVATAR}
                    alt={currentUser.username}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/[0.08]"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {currentUser.name || currentUser.username}
                    </div>

                    <div className="truncate text-xs text-muted">
                      @{currentUser.username}
                    </div>
                  </div>
                </a>

                <div className="mt-3 flex gap-4 px-2 text-xs">
                  <div>
                    <span className="font-semibold text-text">
                      {followersCount}
                    </span>{" "}
                    <span className="text-muted">followers</span>
                  </div>

                  <div>
                    <span className="font-semibold text-text">
                      {followingCount}
                    </span>{" "}
                    <span className="text-muted">following</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-surface text-sm text-muted transition hover:border-white/[0.14] hover:bg-card hover:text-text"
                >
                  <Icon name="logout" size={16} />
                  Log out
                </button>

                {currentUser.role === "admin" && (
                  <button
                    type="button"
                    onClick={clearAllTweets}
                    className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-danger/10 text-sm text-red-400 transition hover:border-red-400/25 hover:bg-danger/20"
                  >
                    <Icon name="trash" size={15} />
                    Clear all posts
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 border-x border-white/[0.08] lg:max-w-[720px]">
          {/* feed header */}
          <div className="sticky top-16 z-30 border-b border-white/[0.08] bg-bg/95 backdrop-blur-xl lg:top-0">
            <div className="flex h-[60px] items-center justify-between px-5">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Home</h1>

                <p className="hidden text-xs text-muted sm:block">
                  What's happening in your community
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <Icon name="spark" size={15} />
              </div>
            </div>
          </div>

          {/* new post box */}
          <section className="border-b border-white/[0.08] p-4 sm:p-5">
            <form onSubmit={postTweet}>
              <div className="flex gap-3">
                <img
                  src={currentUser?.avatar || DEFAULT_AVATAR}
                  alt={currentUser?.username || "You"}
                  className="mt-1 h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/[0.08]"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />

                <div className="min-w-0 flex-1">
                  <textarea
                    id="tweet-content"
                    dir="auto"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share something with Pulse..."
                    rows={3}
                    className="w-full resize-none bg-transparent py-1 text-[15px] leading-6 text-text outline-none placeholder:text-muted/60"
                  />

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-xs text-muted">
                      {content.length > 0
                        ? `${content.length} characters`
                        : "Share an update"}
                    </span>

                    <button
                      type="submit"
                      disabled={loading || !content.trim()}
                      className="flex h-9 items-center gap-2 rounded-lg border border-accent/70 bg-accent px-4 text-sm font-medium text-bg shadow-sm transition hover:bg-accent/90 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? (
                        "Posting..."
                      ) : (
                        <>
                          Post
                          <Icon name="arrow" size={14} strokeWidth={2} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

          {/* posts */}
          <section>
            {initialLoading ? (
              <div className="divide-y divide-white/[0.08]">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse p-5">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-card" />

                      <div className="flex-1">
                        <div className="h-3 w-28 rounded bg-card" />
                        <div className="mt-2 h-3 w-20 rounded bg-card" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="h-3 w-full rounded bg-card" />
                      <div className="h-3 w-4/5 rounded bg-card" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tweets.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-surface text-muted">
                  <Icon name="spark" size={20} />
                </div>

                <h2 className="mt-5 text-sm font-semibold">Nothing here yet</h2>

                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
                  Be the first person to share something with your community.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.08]">
                {tweets.map((tweet) => {
                  const userId = tweet.user?.id ?? tweet.user_id;

                  const username =
                    tweet.user?.username ?? tweet.username ?? "unknown";

                  const isFollowing = followingIds.has(userId);

                  const isOwnPost =
                    currentUser &&
                    (currentUser.id === tweet.user_id ||
                      currentUser.id === tweet.user?.id);

                  const canDelete =
                    currentUser && (currentUser.role === "admin" || isOwnPost);

                  return (
                    <article
                      key={tweet.id}
                      className="group px-4 py-5 transition hover:bg-white/[0.018] sm:px-5"
                    >
                      <div className="flex items-start gap-3">
                        <a href={`/profile/${username}`} className="shrink-0">
                          <img
                            src={
                              tweet.avatar ||
                              tweet.user?.avatar ||
                              DEFAULT_AVATAR
                            }
                            alt={username}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-white/[0.08]"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_AVATAR;
                            }}
                          />
                        </a>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/profile/${username}`}
                              className="truncate text-sm font-semibold hover:underline"
                            >
                              {username}
                            </a>

                            <span className="text-xs text-muted">·</span>

                            <time className="shrink-0 text-xs text-muted">
                              {new Date(
                                tweet.created_at || "",
                              ).toLocaleString()}
                            </time>

                            <div className="ml-auto">
                              <button
                                type="button"
                                aria-label="More options"
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted opacity-0 transition hover:border-white/[0.08] hover:bg-surface hover:text-text group-hover:opacity-100"
                              >
                                <Icon name="more" size={16} />
                              </button>
                            </div>
                          </div>

                          {currentUser && userId !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleFollowToggle(userId, !isFollowing)
                              }
                              className={
                                isFollowing
                                  ? "mt-2 inline-flex h-7 items-center rounded-full border border-white/[0.08] bg-surface px-3 text-xs text-muted transition hover:border-white/[0.14] hover:bg-card hover:text-text"
                                  : "mt-2 inline-flex h-7 items-center rounded-full border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent transition hover:border-accent/60 hover:bg-accent/15"
                              }
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          )}

                          <div className="mt-3 text-[15px] leading-6 text-text">
                            {String(tweet.content || "")
                              .split(/\r?\n/)
                              .map((line, index) => {
                                const rtl = detectRTL(line);

                                return (
                                  <div
                                    key={index}
                                    dir={rtl ? "rtl" : "ltr"}
                                    className={rtl ? "text-right" : ""}
                                  >
                                    {line === "" ? <br /> : line}
                                  </div>
                                );
                              })}
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLike(tweet)}
                              aria-pressed={!!tweet.is_liked}
                              className={
                                tweet.is_liked
                                  ? "flex h-8 items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 text-xs font-medium text-red-400 transition hover:bg-red-500/15"
                                  : "flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-surface px-3 text-xs text-muted transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-400"
                              }
                            >
                              <Icon
                                name="heart"
                                size={15}
                                strokeWidth={tweet.is_liked ? 2.4 : 1.8}
                              />

                              <span>{tweet.likes_count || 0}</span>
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(tweet)}
                                className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-surface px-3 text-xs text-muted opacity-0 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                              >
                                <Icon name="trash" size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* right side info */}
        <aside className="hidden w-[280px] shrink-0 xl:block">
          <div className="sticky top-0 px-5 py-7">
            <div className="rounded-2xl border border-white/[0.08] bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                  <Icon name="spark" size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">Your Pulse</h2>

                  <p className="text-xs text-muted">
                    Your community at a glance
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/[0.06] bg-card p-3">
                  <div className="text-lg font-semibold">{followersCount}</div>

                  <div className="mt-1 text-xs text-muted">Followers</div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-card p-3">
                  <div className="text-lg font-semibold">{followingCount}</div>

                  <div className="mt-1 text-xs text-muted">Following</div>
                </div>
              </div>
            </div>

            <div className="mt-5 px-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted/60">
                Pulse
              </div>

              <p className="mt-2 text-xs leading-5 text-muted">
                A quieter place to share what's actually happening.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
