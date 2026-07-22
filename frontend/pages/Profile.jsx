import { useEffect, useState } from "react";
import { useParams } from "react-router";

const API_BASE = "/Pulse/backend/index.php/api";

function detectRTL(text) {
  const rtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  let count = 0;
  for (const ch of text) if (rtl.test(ch)) count++;
  return text.length > 0 && count / text.length > 0.2;
}

export default function Profile() {
  const { username } = useParams();
  const [tweets, setTweets] = useState([]);
  const [user, setUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // safely parse JSON responses and log raw text when parse fails
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          const me = await fetch(`${API_BASE}/me`, { credentials: "include" });
          if (me.ok) {
            const j = await parseJsonSafe(me, "me");
            const cur = j?.data ?? null;
            setCurrentUser(cur);
            // capture current user for local checks
            window.__profile_cur_user = cur;
            console.debug("Profile: current user", cur);
          }
        } catch {
          // Authentication is optional while loading a public profile.
        }
        // attempt to find user via search endpoint
        const res = await fetch(
          `${API_BASE}/search?q=${encodeURIComponent(username)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const users = await parseJsonSafe(res, "search");
        console.debug("Profile: search response", users);
        const userList = Array.isArray(users)
          ? users
          : Array.isArray(users?.data)
            ? users.data
            : [];
        let u =
          userList.find(
            (x) => x.username?.toLowerCase() === username.toLowerCase(),
          ) || null;

        // fallback: if search didn't return the user, try direct lookup by username
        if (!u) {
          try {
            const su = await fetch(
              `${API_BASE}/users/username/${encodeURIComponent(username)}`,
              { credentials: "include" },
            );
            if (su.ok) {
              const suj = await parseJsonSafe(su, "userByUsername");
              console.debug("Profile: direct user lookup", suj);
              // API uses Response::success wrapper
              u = suj?.data ?? suj ?? null;
            }
          } catch (e) {
            console.error("direct user lookup failed", e);
          }
        }

        if (mounted) setUser(u || { username });

        // fetch followers/following counts when we have the user id
        if (mounted && u && u.id) {
          try {
            const f1 = await fetch(`${API_BASE}/users/${u.id}/followers`, {
              credentials: "include",
            });
            if (f1.ok) {
              const fj = await parseJsonSafe(f1, "followers");
              console.debug("Profile: followers list", fj);
              const fl = Array.isArray(fj)
                ? fj
                : Array.isArray(fj?.data)
                  ? fj.data
                  : [];
              setFollowersCount(Array.isArray(fl) ? fl.length : 0);
              const cur = window.__profile_cur_user ?? currentUser;
              if (cur) {
                setIsFollowing(
                  Array.isArray(fl) ? fl.some((x) => x.id === cur.id) : false,
                );
              }
            }
            const f2 = await fetch(`${API_BASE}/users/${u.id}/following`, {
              credentials: "include",
            });
            if (f2.ok) {
              const fj2 = await parseJsonSafe(f2, "following");
              console.debug("Profile: following list", fj2);
              const fl2 = Array.isArray(fj2)
                ? fj2
                : Array.isArray(fj2?.data)
                  ? fj2.data
                  : [];
              setFollowingCount(Array.isArray(fl2) ? fl2.length : 0);
            }
          } catch (e) {
            console.error("followers load", e);
          }
        }

        // fetch tweets via global feed and filter for this user (same logic as Feed)
        if (u) {
          try {
            const rt = await fetch(`${API_BASE}/tweets`, {
              credentials: "include",
            });
            if (rt.ok) {
              const j = await parseJsonSafe(rt, "tweets");
              const list = Array.isArray(j)
                ? j
                : Array.isArray(j?.data)
                  ? j.data
                  : [];
              const filtered = Array.isArray(list)
                ? list.filter(
                    (t) =>
                      (t.user?.username || t.username || "").toLowerCase() ===
                      username.toLowerCase(),
                  )
                : [];
              if (Array.isArray(filtered))
                filtered.sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at),
                );
              if (mounted) setTweets(filtered);
            }
          } catch (e) {
            console.error("user tweets load", e);
          }
        }
      } catch (e) {
        console.error("profile load", e);
      }
    })();
    return () => (mounted = false);
  }, [username, currentUser]);

  // listen for follow events and refresh requests from other pages (feed)
  useEffect(() => {
    function onFollowChanged(e) {
      const detail = e?.detail;
      if (!detail || !user?.id) return;
      if (detail.userId !== user.id) return;
      setFollowersCount((c) => (detail.follow ? c + 1 : Math.max(0, c - 1)));
      setIsFollowing(!!detail.follow);
    }

    async function onRefresh() {
      if (!user?.id) return;
      try {
        const f1 = await fetch(`${API_BASE}/users/${user.id}/followers`, {
          credentials: "include",
        });
        if (f1.ok) {
          const fj = await parseJsonSafe(f1, "followersRefresh");
          const fl = Array.isArray(fj)
            ? fj
            : Array.isArray(fj?.data)
              ? fj.data
              : [];
          setFollowersCount(Array.isArray(fl) ? fl.length : 0);
          const cur = window.__profile_cur_user ?? currentUser;
          if (cur) {
            setIsFollowing(
              Array.isArray(fl) ? fl.some((x) => x.id === cur.id) : false,
            );
          }
        }
        const f2 = await fetch(`${API_BASE}/users/${user.id}/following`, {
          credentials: "include",
        });
        if (f2.ok) {
          const fj2 = await parseJsonSafe(f2, "followingRefresh");
          const fl2 = Array.isArray(fj2)
            ? fj2
            : Array.isArray(fj2?.data)
              ? fj2.data
              : [];
          setFollowingCount(Array.isArray(fl2) ? fl2.length : 0);
        }

        // refresh tweets via global feed and filter by username
        const rt = await fetch(`${API_BASE}/tweets`, {
          credentials: "include",
        });
        if (rt.ok) {
          const j = await parseJsonSafe(rt, "tweetsRefresh");
          const list = Array.isArray(j)
            ? j
            : Array.isArray(j?.data)
              ? j.data
              : [];
          const filtered = Array.isArray(list)
            ? list.filter(
                (t) =>
                  (t.user?.username || t.username || "").toLowerCase() ===
                  username.toLowerCase(),
              )
            : [];
          if (Array.isArray(filtered))
            filtered.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
          setTweets(filtered);
        }
      } catch (err) {
        console.error("profile refresh failed", err);
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
  }, [user, currentUser, username]);

  async function handleDelete(tweet) {
    if (!currentUser) return;
    const id = tweet.id;
    const canDelete =
      currentUser.role === "admin" ||
      currentUser.id === tweet.user_id ||
      currentUser.id === tweet.user?.id;
    if (!canDelete) return alert("Not authorized to delete this tweet");
    if (!confirm("Delete this tweet?")) return;
    try {
      const res = await fetch(`${API_BASE}/tweets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        // refresh profile tweets
        const rt2 = await fetch(`${API_BASE}/tweets`, {
          credentials: "include",
        });
        if (rt2.ok) {
          const j = await parseJsonSafe(rt2, "tweetsAfterDelete");
          const list = Array.isArray(j)
            ? j
            : Array.isArray(j?.data)
              ? j.data
              : [];
          if (Array.isArray(list))
            list.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
          setTweets(
            Array.isArray(list)
              ? list.filter(
                  (t) =>
                    (t.user?.username || t.username || "").toLowerCase() ===
                    username.toLowerCase(),
                )
              : [],
          );
        }
      } else {
        alert("Delete failed");
      }
    } catch (e) {
      console.error("delete error", e);
      alert("Delete failed");
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

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,700px)_1fr] gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-card rounded-3xl p-6">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      user?.avatar ||
                      user?.profile_image ||
                      "/Pulse/backend/public/uploads/user.jpg"
                    }
                    alt={user?.username}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "/Pulse/backend/public/uploads/user.jpg")
                    }
                  />

                  <div>
                    <h2 className="font-semibold text-lg">
                      {user?.name || "@" + username}
                    </h2>

                    <div className="text-muted">
                      @{user?.username || username}
                    </div>
                  </div>
                </div>

                {user?.bio && (
                  <p className="text-small text-muted mt-4 leading-relaxed">
                    {user.bio}
                  </p>
                )}

                <div className="flex gap-6 mt-5">
                  <div>
                    <div className="font-semibold">{followersCount}</div>
                    <div className="text-small text-muted">Followers</div>
                  </div>

                  <div>
                    <div className="font-semibold">{followingCount}</div>
                    <div className="text-small text-muted">Following</div>
                  </div>
                </div>

                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="mt-5 w-full h-11 rounded-full bg-surface hover:bg-white/5"
                  >
                    Logout
                  </button>
                )}

                {currentUser && user?.id && currentUser.id !== user.id && (
                  <div className="mt-3">
                    {isFollowing ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `${API_BASE}/users/${user.id}/follow`,
                              {
                                method: "DELETE",
                                credentials: "include",
                              },
                            );

                            if (res.ok) {
                              setIsFollowing(false);
                              setFollowersCount((c) => Math.max(0, c - 1));

                              window.dispatchEvent(
                                new CustomEvent("profile:followChanged", {
                                  detail: {
                                    userId: user.id,
                                    follow: false,
                                  },
                                }),
                              );
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full h-11 rounded-full bg-surface"
                      >
                        Following
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `${API_BASE}/users/${user.id}/follow`,
                              {
                                method: "POST",
                                credentials: "include",
                              },
                            );

                            if (res.ok) {
                              setIsFollowing(true);
                              setFollowersCount((c) => c + 1);

                              window.dispatchEvent(
                                new CustomEvent("profile:followChanged", {
                                  detail: {
                                    userId: user.id,
                                    follow: true,
                                  },
                                }),
                              );
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full h-11 rounded-full bg-accent text-bg font-medium"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN FEED */}
          <main className="min-w-0">
            {/* MOBILE PROFILE */}
            <div className="lg:hidden bg-card rounded-3xl p-5 mb-6">
              <div className="flex gap-4">
                <img
                  src={
                    user?.avatar ||
                    user?.profile_image ||
                    "/Pulse/backend/public/uploads/user.jpg"
                  }
                  alt={user?.username}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "/Pulse/backend/public/uploads/user.jpg")
                  }
                />

                <div>
                  <h2 className="font-semibold text-lg">
                    {user?.name || "@" + username}
                  </h2>

                  <div className="text-muted">
                    @{user?.username || username}
                  </div>

                  <div className="flex gap-4 mt-2 text-small">
                    <span>{followersCount} Followers</span>
                    <span>{followingCount} Following</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HEADER */}
            <div
              className="
              sticky
              top-0
              z-20
              bg-bg/80
              backdrop-blur-xl
              border-b
              border-white/5
              mb-4
            "
            >
              <div className="py-4">
                <h3 className="font-semibold text-lg">Posts</h3>
              </div>
            </div>

            <section className="space-y-4">
              {tweets.length === 0 && (
                <div className="text-muted">No posts yet.</div>
              )}

              {tweets.map((t) => (
                <article
                  key={t.id}
                  className="
                  bg-card
                  rounded-3xl
                  p-5
                  hover:shadow-xl
                  transition-all
                "
                >
                  <div className="flex gap-3">
                    <img
                      src={
                        t.avatar ||
                        t.profile_image ||
                        t.user?.avatar ||
                        t.user?.profile_image ||
                        "/Pulse/backend/public/uploads/user.jpg"
                      }
                      alt={t.user?.username || t.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "/Pulse/backend/public/uploads/user.jpg")
                      }
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/profile/${t.user?.username || t.username}`}
                          className="font-semibold"
                        >
                          {t.user?.username || t.username}
                        </a>
                      </div>

                      <div className="mt-3 leading-relaxed">
                        {String(t.content || "")
                          .split(/\r?\n/)
                          .map((line, idx) => (
                            <div
                              key={idx}
                              dir={detectRTL(line) ? "rtl" : "ltr"}
                            >
                              {line === "" ? <br /> : line}
                            </div>
                          ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-small text-muted">
                          {new Date(t.created_at || "").toLocaleString()}
                        </span>

                        {(currentUser?.role === "admin" ||
                          currentUser?.id === t.user_id ||
                          currentUser?.id === t.user?.id) && (
                          <button
                            onClick={() => handleDelete(t)}
                            className="
                              px-4
                              h-9
                              rounded-full
                              bg-surface
                              text-red-400
                            "
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </main>

          {/* RIGHT SIDEBAR removed */}
        </div>
      </div>
    </div>
  );
}
