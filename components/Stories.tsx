import type { CurrentUser } from "@/types/current-user";
import UserAvatar from "./UserAvatar";

const stories = [
  { name: "Ariana", initials: "AK", ring: "ring-1" },
  { name: "Jovan", initials: "JN", ring: "ring-2" },
  { name: "Maya", initials: "MT", ring: "ring-3" },
  { name: "Zara", initials: "ZR", ring: "ring-4" },
  { name: "Lucas", initials: "LU", ring: "ring-5" },
];

type StoriesProps = {
  currentUser: CurrentUser;
};

export default function Stories({ currentUser }: StoriesProps) {
  return (
    <section className="stories card" aria-label="Stories">
      <button className="story story-create" type="button">
        <span className="story-ring add-ring"><UserAvatar initials={currentUser.initials} image={currentUser.image} theme={currentUser.avatarTheme} className="story-avatar" /><b>+</b></span>
        <small>Your story</small>
      </button>
      {stories.map((story) => (
        <button className="story" type="button" key={story.name}>
          <span className={`story-ring ${story.ring}`}><span>{story.initials}</span></span>
          <small>{story.name}</small>
        </button>
      ))}
    </section>
  );
}
