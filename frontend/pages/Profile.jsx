import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";
const FALLBACK_AVATAR = "/Pulse/backend/public/uploads/user.jpg";

function detectRTL(text) {
  const rtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  let count = 0;

  for (const ch of text) {
    if (rtl.test(ch)) count++;
  }

  return text.length > 0 && count / text.length > 0.2;
}

function Icon({ name, className = "w-5 h-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 21c.8-4.1 3.3-6 7.5-6s6.7 1.9 7.5 6" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3.5" />
        <path d="M17 11a3.5 3.5 0 0 0 0-7" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 5-7" />
        <circle cx="7" cy="15" r="1" fill="currentColor" />
        <circle cx="10" cy="11" r="1" fill="currentColor" />
        <circle cx="13" cy="13" r="1" fill="currentColor" />
        <circle cx="18" cy="6" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M10 4H5v16h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "back") {
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  return null;
}

async function parseJsonSafe(res, label) {
  try {
    return await res.clone().json();
  } catch {
    try {
      const txt = await res.clone().text();
      console.error(`${label} - invalid JSON response:\n`, txt);
      return { __raw_text: txt };
    } catch (e) {
      console.error(`${label} - failed to read response body`, e);
      return null;
    }
  }
}

function getUserAvatar(user) {
  return user?.avatar || user?.profile_image || FALLBACK_AVATAR;
}

function getTweetUsername(tweet) {
  return tweet?.user?.username || tweet?.username || "unknown";
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatChartDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Builds the 30-day activity chart from the user's posts.
function ActivityChart({ tweets }) {
  const points = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      days.push({
        date,
        key: getDayKey(date),
        count: 0,
      });
    }

    const counts = new Map();

    for (const tweet of tweets) {
      if (!tweet?.created_at) continue;

      const date = new Date(tweet.created_at);

      if (Number.isNaN(date.getTime())) continue;

      const key = getDayKey(date);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return days.map((day) => ({
      ...day,
      count: counts.get(day.key) || 0,
    }));
  }, [tweets]);

  const totalPosts = points.reduce((sum, point) => sum + point.count, 0);

  const maxValue = Math.max(1, ...points.map((point) => point.count));

  const width = 640;
  const height = 220;
  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 18;
  const paddingBottom = 34;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const coordinates = points.map((point, index) => {
    const x =
      paddingLeft + (index / Math.max(points.length - 1, 1)) * chartWidth;

    const y = paddingTop + chartHeight - (point.count / maxValue) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    coordinates.length > 0
      ? `${linePath}
         L ${coordinates[coordinates.length - 1].x} ${paddingTop + chartHeight}
         L ${coordinates[0].x} ${paddingTop + chartHeight}
         Z`
      : "";

  const labelIndexes = [0, 7, 14, 21, 29];

  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Activity
          </div>

          <div className="mt-1 text-lg font-semibold text-text">
            Posting activity
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-text">{totalPosts}</div>

          <div className="text-xs text-muted">last 30 days</div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-bg/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label="Posting activity over the last 30 days"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = paddingTop + (line / 3) * chartHeight;

            return (
              <line
                key={line}
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.055)"
                strokeWidth="1"
              />
            );
          })}

          <path d={areaPath} fill="rgba(201,168,106,0.07)" />

          <path
            d={linePath}
            fill="none"
            stroke="#c9a86a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coordinates.map((point) => (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="#101214"
                stroke="#c9a86a"
                strokeWidth="1.8"
              />

              <title>
                {formatChartDate(point.date)} — {point.count}{" "}
                {point.count === 1 ? "post" : "posts"}
              </title>
            </g>
          ))}

          {labelIndexes.map((index) => {
            const point = coordinates[index];

            if (!point) return null;

            return (
              <text
                key={point.key}
                x={point.x}
                y={height - 10}
                textAnchor={
                  index === 0 ? "start" : index === 29 ? "end" : "middle"
                }
                fill="#a5a09a"
                fontSize="10"
              >
                {formatChartDate(point.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-xs text-muted">
        Based on posts published during the last 30 days.
      </div>
    </div>
  );
}

function ProfileStat({ value, label }) {
  return (
    <div>
      <div className="text-xl font-semibold text-text">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

// Renders a single post and its available actions.
function Post({ tweet, currentUser, onDelete }) {
  const username = getTweetUsername(tweet);

  const canDelete =
    currentUser?.role === "admin" ||
    currentUser?.id === tweet?.user_id ||
    currentUser?.id === tweet?.user?.id;

  return (
    <article className="border-b border-white/5 py-6 first:pt-5 last:border-b-0">
      <div className="flex gap-3">
        <Link to={`/profile/${username}`} className="shrink-0">
          <img
            src={getUserAvatar(tweet?.user)}
            alt={username}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_AVATAR;
            }}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/profile/${username}`}
                className="font-medium text-text hover:text-accent transition-colors"
              >
                {tweet?.user?.name || `@${username}`}
              </Link>

              <span className="ml-2 text-sm text-muted">@{username}</span>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(tweet)}
                className="shrink-0 text-muted hover:text-red-400 transition-colors"
                aria-label="Delete post"
                title="Delete post"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-3 text-[15px] leading-7 text-text">
            {String(tweet?.content || "")
              .split(/\r?\n/)
              .map((line, index) => (
                <div key={index} dir={detectRTL(line) ? "rtl" : "ltr"}>
                  {line === "" ? <br /> : line}
                </div>
              ))}
          </div>

          <div className="mt-4 text-xs text-muted">
            {formatDate(tweet?.created_at)}
          </div>
        </div>
      </div>
    </article>
  );
}

// Profile page and its follow/post management.
export default function Profile() {
  const { username } = useParams();

  const [tweets, setTweets] = useState([]);
  const [user, setUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  async function loadTweets(profileUser) {
    if (!profileUser) return;

    try {
      const response = await fetch(`${API_BASE}/tweets`, {
        credentials: "include",
      });

      if (!response.ok) return;

      const json = await parseJsonSafe(response, "tweets");

      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];

      const filtered = list.filter((tweet) => {
        const tweetUsername = tweet?.user?.username || tweet?.username || "";

        return (
          tweetUsername.toLowerCase() === profileUser.username.toLowerCase()
        );
      });

      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setTweets(filtered);
    } catch (error) {
      console.error("user tweets load", error);
    }
  }

  async function loadFollowData(profileUser, cur) {
    if (!profileUser?.id) return;

    try {
      const followersResponse = await fetch(
        `${API_BASE}/users/${profileUser.id}/followers`,
        {
          credentials: "include",
        },
      );

      if (followersResponse.ok) {
        const json = await parseJsonSafe(followersResponse, "followers");

        const followers = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

        setFollowersCount(followers.length);

        if (cur) {
          setIsFollowing(
            followers.some(
              (follower) => String(follower?.id) === String(cur.id),
            ),
          );
        }
      }

      const followingResponse = await fetch(
        `${API_BASE}/users/${profileUser.id}/following`,
        {
          credentials: "include",
        },
      );

      if (followingResponse.ok) {
        const json = await parseJsonSafe(followingResponse, "following");

        const following = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

        setFollowingCount(following.length);
      }
    } catch (error) {
      console.error("followers load", error);
    }
  }

  async function loadProfile() {
    setLoading(true);
    setNotFound(false);

    try {
      let cur = null;

      // Load the currently authenticated user.
      try {
        const me = await fetch(`${API_BASE}/me`, {
          credentials: "include",
        });

        if (me.ok) {
          const json = await parseJsonSafe(me, "me");
          cur = json?.data ?? null;

          setCurrentUser(cur);

          // Keep the current user available for the existing event system.
          window.__profile_cur_user = cur;
        }
      } catch (error) {
        console.error("current user load failed", error);
      }

      let profileUser = null;

      // Try the search endpoint first.
      try {
        const searchResponse = await fetch(
          `${API_BASE}/search?q=${encodeURIComponent(username)}`,
          {
            credentials: "include",
          },
        );

        if (searchResponse.ok) {
          const json = await parseJsonSafe(searchResponse, "search");

          const users = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
              ? json.data
              : [];

          profileUser =
            users.find(
              (candidate) =>
                candidate?.username?.toLowerCase() === username.toLowerCase(),
            ) || null;
        }
      } catch (error) {
        console.error("profile search failed", error);
      }

      // Fall back to the direct username endpoint.
      if (!profileUser) {
        try {
          const directResponse = await fetch(
            `${API_BASE}/users/username/${encodeURIComponent(username)}`,
            {
              credentials: "include",
            },
          );

          if (directResponse.ok) {
            const json = await parseJsonSafe(directResponse, "userByUsername");

            profileUser = json?.data ?? json ?? null;
          }
        } catch (error) {
          console.error("direct user lookup failed", error);
        }
      }

      if (!profileUser) {
        setUser(null);
        setNotFound(true);
        setTweets([]);
        return;
      }

      setUser(profileUser);

      await Promise.all([
        loadFollowData(profileUser, cur),
        loadTweets(profileUser),
      ]);
    } catch (error) {
      console.error("profile load failed", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!mounted) return;
      await loadProfile();
    }

    run();

    return () => {
      mounted = false;
    };
  }, [username]);

  // Keep the profile in sync with follow and refresh events.
  useEffect(() => {
    function onFollowChanged(event) {
      const detail = event?.detail;

      if (!detail || !user?.id) return;

      if (String(detail.userId) !== String(user.id)) {
        return;
      }

      // The profile already updates itself for local follow actions.
      if (detail.source === "profile") {
        return;
      }

      setFollowersCount((count) =>
        detail.follow ? count + 1 : Math.max(0, count - 1),
      );

      setIsFollowing(!!detail.follow);
    }

    async function onRefresh() {
      if (!user?.id) return;

      try {
        const cur = window.__profile_cur_user ?? currentUser;

        await Promise.all([loadFollowData(user, cur), loadTweets(user)]);
      } catch (error) {
        console.error("profile refresh failed", error);
      }
    }

    window.addEventListener("profile:followChanged", onFollowChanged);

    window.addEventListener("profile:refresh", onRefresh);

    window.__profile_refresh = onRefresh;

    return () => {
      window.removeEventListener("profile:followChanged", onFollowChanged);

      window.removeEventListener("profile:refresh", onRefresh);

      delete window.__profile_refresh;
    };
  }, [user, currentUser]);

  // Toggle the current user's follow state.
  async function handleFollow() {
    if (!currentUser || !user?.id || followLoading) {
      return;
    }

    setFollowLoading(true);

    try {
      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(`${API_BASE}/users/${user.id}/follow`, {
        method,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Follow request failed");
      }

      const nextFollowing = !isFollowing;

      setIsFollowing(nextFollowing);

      setFollowersCount((count) =>
        nextFollowing ? count + 1 : Math.max(0, count - 1),
      );

      window.dispatchEvent(
        new CustomEvent("profile:followChanged", {
          detail: {
            userId: user.id,
            follow: nextFollowing,
            source: "profile",
          },
        }),
      );
    } catch (error) {
      console.error("follow/unfollow failed", error);
    } finally {
      setFollowLoading(false);
    }
  }

  // Delete a post when the current user has permission.
  async function handleDelete(tweet) {
    if (!currentUser) return;

    const canDelete =
      currentUser.role === "admin" ||
      currentUser.id === tweet.user_id ||
      currentUser.id === tweet.user?.id;

    if (!canDelete) {
      alert("Not authorized to delete this tweet");
      return;
    }

    if (!confirm("Delete this tweet?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tweets/${tweet.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        alert("Delete failed");
        return;
      }

      setTweets((current) => current.filter((item) => item.id !== tweet.id));
    } catch (error) {
      console.error("delete error", error);
      alert("Delete failed");
    }
  }

  // Sign out and return to the login page.
  async function handleLogout() {
    try {
      const response = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.replace("/login");
      } else {
        console.error("logout failed", await response.text());

        alert("Logout failed");
      }
    } catch (error) {
      console.error("logout error", error);
      alert("Logout failed");
    }
  }

  // Show the profile skeleton while data is loading.
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <div className="max-w-[1500px] mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,720px)_300px] gap-8">
            <aside className="hidden lg:block">
              <div className="h-48 rounded-xl bg-card animate-pulse" />
            </aside>

            <main>
              <div className="h-64 rounded-2xl bg-card animate-pulse" />
              <div className="mt-5 h-80 rounded-xl bg-card animate-pulse" />
            </main>

            <aside className="hidden lg:block">
              <div className="h-80 rounded-xl bg-card animate-pulse" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing or invalid profiles.
  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            Pulse
          </div>

          <h1 className="mt-3 text-2xl font-semibold">Profile not found</h1>

          <p className="mt-2 text-muted">We couldn't find @{username}.</p>

          <Link
            to="/feed"
            className="inline-flex items-center gap-2 mt-6 text-sm text-muted hover:text-text transition-colors"
          >
            <Icon name="back" className="w-4 h-4" />
            <span>Back to Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    currentUser?.id && user?.id && String(currentUser.id) === String(user.id);

  const last30DaysPosts = tweets.filter((tweet) => {
    if (!tweet?.created_at) {
      return false;
    }

    const date = new Date(tweet.created_at);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    return diff <= 30 * 24 * 60 * 60 * 1000 && diff >= 0;
  }).length;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Subtle ambient background glow. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 w-[700px] h-[500px] -translate-x-1/2 rounded-full bg-accent/[0.025] blur-3xl" />
      </div>

      <div className="relative max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,720px)_300px] gap-6 xl:gap-8">
          {/* Desktop sidebar. */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              {/* Brand. */}
              <div className="px-2">
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl border border-accent/20 bg-accent/[0.08] flex items-center justify-center text-accent font-semibold transition-colors group-hover:bg-accent/[0.12]">
                    P
                  </div>

                  <span className="text-lg font-semibold tracking-tight">
                    Pulse
                  </span>
                </Link>
              </div>

              {/* Main navigation. */}
              <nav className="mt-8 space-y-1">
                {/* Feed link. */}
                <Link
                  to="/feed"
                  className="group flex items-center gap-3 px-3 h-11 rounded-lg text-text hover:bg-white/[0.045] transition-colors"
                >
                  <Icon
                    name="home"
                    className="w-[18px] h-[18px] text-muted group-hover:text-accent transition-colors"
                  />

                  <span className="text-sm font-medium">Feed</span>
                </Link>

                {/* Current profile link. */}
                <Link
                  to={`/profile/${user.username}`}
                  className="group flex items-center gap-3 px-3 h-11 rounded-lg bg-white/[0.045] text-text transition-colors"
                >
                  <Icon name="user" className="w-[18px] h-[18px] text-accent" />

                  <span className="text-sm font-medium">Profile</span>
                </Link>
              </nav>

              {/* Account details and logout. */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-muted">
                  Account
                </div>

                <div className="mt-4 flex items-center gap-3 px-3">
                  <img
                    src={getUserAvatar(currentUser)}
                    alt={currentUser?.username || "Account"}
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />

                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {currentUser?.name || currentUser?.username || "Account"}
                    </div>

                    {currentUser?.username && (
                      <div className="text-xs text-muted truncate">
                        @{currentUser.username}
                      </div>
                    )}
                  </div>
                </div>

                {currentUser && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-5 flex items-center gap-3 w-full px-3 h-10 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/[0.04] transition-colors"
                  >
                    <Icon name="logout" className="w-[18px] h-[18px]" />

                    <span className="text-sm">Logout</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main profile content. */}
          <main className="min-w-0">
            {/* Mobile navigation. */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between gap-4">
                <Link to="/feed" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg bg-accent/[0.08] border border-accent/20 flex items-center justify-center text-accent font-semibold">
                    P
                  </div>

                  <span className="font-semibold tracking-tight">Pulse</span>
                </Link>

                <div className="flex items-center gap-4">
                  <Link
                    to="/feed"
                    className="text-sm font-medium text-text hover:text-accent transition-colors"
                  >
                    Feed
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-muted hover:text-text transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Profile header and user information. */}
            <section className="border border-white/5 bg-card rounded-2xl overflow-hidden">
              <div className="h-28 sm:h-36 bg-gradient-to-br from-[#1c2025] via-[#181b1f] to-[#14171a] border-b border-white/5 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(201,168,106,0.08),transparent_45%)]" />
              </div>

              <div className="px-5 sm:px-7 pb-6">
                <div className="-mt-12 relative">
                  <img
                    src={getUserAvatar(user)}
                    alt={user.username || username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-xl"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {user.name || `@${username}`}
                    </h1>

                    <div className="mt-1 text-sm text-muted">
                      @{user.username || username}
                    </div>

                    {user.bio && (
                      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {!isOwnProfile && currentUser && (
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`shrink-0 h-10 px-5 rounded-full text-sm font-medium transition ${
                        isFollowing
                          ? "bg-surface border border-white/10 text-text hover:border-white/20"
                          : "bg-accent text-bg hover:brightness-105"
                      } ${
                        followLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {followLoading
                        ? "..."
                        : isFollowing
                          ? "Following"
                          : "Follow"}
                    </button>
                  )}
                </div>

                {/* Profile counts. */}
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-8">
                  <ProfileStat value={tweets.length} label="Posts" />

                  <ProfileStat value={followersCount} label="Followers" />

                  <ProfileStat value={followingCount} label="Following" />
                </div>
              </div>
            </section>

            {/* Activity chart for smaller screens. */}
            <section className="lg:hidden mt-6 border border-white/5 bg-card rounded-2xl p-5">
              <ActivityChart tweets={tweets} />
            </section>

            {/* Posts tab header. */}
            <div className="mt-7 border-b border-white/5">
              <div className="h-12 flex items-center">
                <div className="relative h-full flex items-center">
                  <span className="text-sm font-medium">Posts</span>

                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full" />
                </div>
              </div>
            </div>

            {/* User posts. */}
            <section>
              {tweets.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-muted">
                    <Icon name="chart" className="w-5 h-5" />
                  </div>

                  <div className="mt-4 text-sm font-medium">No posts yet</div>

                  <div className="mt-1 text-xs text-muted">
                    When this user posts, they'll appear here.
                  </div>
                </div>
              ) : (
                tweets.map((tweet) => (
                  <Post
                    key={tweet.id}
                    tweet={tweet}
                    currentUser={currentUser}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </section>
          </main>

          {/* Desktop analytics sidebar. */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-4">
              {/* Profile overview. */}
              <section className="border border-white/5 bg-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-muted">
                  <Icon name="chart" className="w-4 h-4" />

                  <span className="text-[10px] uppercase tracking-[0.18em]">
                    Overview
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-y-5">
                  <div>
                    <div className="text-lg font-semibold">{tweets.length}</div>

                    <div className="text-xs text-muted mt-1">Posts</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold">
                      {followersCount}
                    </div>

                    <div className="text-xs text-muted mt-1">Followers</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold">
                      {followingCount}
                    </div>

                    <div className="text-xs text-muted mt-1">Following</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold">
                      {last30DaysPosts}
                    </div>

                    <div className="text-xs text-muted mt-1">Last 30 days</div>
                  </div>
                </div>
              </section>

              {/* Activity chart. */}
              <section className="border border-white/5 bg-card rounded-2xl p-5">
                <ActivityChart tweets={tweets} />
              </section>

              {/* Basic profile information. */}
              <section className="border border-white/5 bg-card rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Profile
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={getUserAvatar(user)}
                    alt={user.username || username}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />

                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.name || `@${username}`}
                    </div>

                    <div className="text-xs text-muted truncate">
                      @{user.username || username}
                    </div>
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-4 text-xs leading-5 text-muted">
                    {user.bio}
                  </p>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
