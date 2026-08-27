import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildVisiblePostWhere, getAcceptedFriendIds } from "@/lib/post-access";
import { getInitials } from "@/lib/social-author";
import { getProfileCategoryLabel } from "@/lib/profile-categories";
import ProfileFollowButton from "@/components/ProfileFollowButton";

function formatJoined(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(value);
}

function formatPostDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) redirect("/login");

  const { userId } = await params;
  const viewer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!viewer) redirect("/login");
  if (viewer.id === userId) redirect("/#profile");

  const friendIds = await getAcceptedFriendIds(viewer.id);
  const visiblePostWhere = buildVisiblePostWhere(viewer.id, friendIds);

  const [profile, posts, visiblePostCount, viewerFollow] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        image: true,
        coverImage: true,
        coverPositionX: true,
        coverPositionY: true,
        coverZoom: true,
        location: true,
        website: true,
        category: true,
        createdAt: true,
        _count: { select: { followers: true, following: true } },
      },
    }),
    prisma.post.findMany({
      where: { AND: [visiblePostWhere, { authorId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, text: true, visibility: true, createdAt: true },
    }),
    prisma.post.count({ where: { AND: [visiblePostWhere, { authorId: userId }] } }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: userId } },
      select: { id: true },
    }),
  ]);

  if (!profile) notFound();

  const name = profile.name || profile.username || profile.email.split("@")[0] || "User";
  const username = profile.username || profile.email.split("@")[0] || "user";
  const category = profile.category ? getProfileCategoryLabel(profile.category) : "";

  return (
    <main className="public-profile-page">
      <div className="public-profile-shell">
        <div className="public-profile-topbar">
          <a className="public-profile-home-link" href="/">← Back to Gupto</a>
        </div>

        <section className="public-profile-card" aria-label={`${name} profile`}>
          <div className="public-profile-cover">
            {profile.coverImage ? (
              <img
                src={profile.coverImage}
                alt=""
                style={{
                  objectPosition: `${50 + profile.coverPositionX}% ${50 + profile.coverPositionY}%`,
                  transform: `scale(${Math.max(1, profile.coverZoom)})`,
                }}
              />
            ) : null}
          </div>
          <div className="public-profile-content">
            <div className="public-profile-avatar" aria-label={`${name} profile photo`}>
              {profile.image ? <img src={profile.image} alt="" /> : <span>{getInitials(name)}</span>}
            </div>
            <h1 className="public-profile-name">{name}</h1>
            <ProfileFollowButton userId={profile.id} initialFollowing={Boolean(viewerFollow)} />
            <div className="public-profile-handle">
              @{username}{category ? <> <span aria-hidden="true">·</span> <span className="public-profile-category">{category}</span></> : null}
            </div>
            {profile.bio ? <p className="public-profile-bio">{profile.bio}</p> : null}
            <div className="public-profile-meta">
              {profile.location ? <span>{profile.location}</span> : null}
              {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer noopener">{profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : null}
              <span>Joined {formatJoined(profile.createdAt)}</span>
            </div>
            <div className="public-profile-stats">
              <div className="public-profile-stat"><strong>{visiblePostCount}</strong><span>Visible posts</span></div>
              <div className="public-profile-stat"><strong>{profile._count.followers}</strong><span>Followers</span></div>
              <div className="public-profile-stat"><strong>{profile._count.following}</strong><span>Following</span></div>
            </div>
          </div>
        </section>

        <h2 className="public-profile-section-title">Posts</h2>
        <section className="public-profile-post-list" aria-label={`${name} posts`}>
          {posts.length ? posts.map((post) => (
            <article className="public-profile-post" key={post.id}>
              <div className="public-profile-post-meta">
                <span>{formatPostDate(post.createdAt)}</span>
                <span>{post.visibility === "PUBLIC" ? "Public" : post.visibility === "FRIENDS" ? "Friends only" : "Private"}</span>
              </div>
              <p>{post.text}</p>
            </article>
          )) : <div className="public-profile-empty">No posts are visible to you yet.</div>}
        </section>
      </div>
    </main>
  );
}
