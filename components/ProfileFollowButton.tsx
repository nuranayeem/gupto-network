"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileFollowButton({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [saving, setSaving] = useState(false);

  const toggleFollow = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(userId)}/follow`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { following?: boolean; error?: string } | null;
      if (!response.ok || typeof payload?.following !== "boolean") return;
      setFollowing(payload.following);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      className={`public-profile-follow-btn${following ? " following" : ""}`}
      type="button"
      disabled={saving}
      aria-pressed={following}
      onClick={toggleFollow}
    >
      {saving ? "Updating…" : following ? "Following" : "Follow"}
    </button>
  );
}
