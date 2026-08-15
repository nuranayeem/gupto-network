import type { ChangeEvent, RefObject } from "react";

type ComposerProps = {
  value: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onPublish: () => void;
};

export default function Composer({ value, inputRef, onChange, onPublish }: ComposerProps) {
  return (
    <section className="composer card" id="composer">
      <div className="composer-main">
        <span className="profile-avatar large">RS</span>
        <textarea
          id="postInput"
          ref={inputRef}
          maxLength={280}
          rows={1}
          placeholder="Share what matters…"
          aria-label="Write a post"
          value={value}
          onChange={onChange}
        />
      </div>
      <div className="composer-footer">
        <div className="composer-tools">
          <button type="button" className="tool-btn" title="Add photo">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>
            <span>Media</span>
          </button>
          <button type="button" className="tool-btn" title="Add emoji">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8 14c1 2 7 2 8 0"/></svg>
            <span>Feeling</span>
          </button>
          <button type="button" className="tool-btn" title="Add location">
            <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>Location</span>
          </button>
        </div>
        <div className="composer-submit">
          <span className="char-count" id="charCount">{value.length} / 280</span>
          <button id="publishBtn" className="publish-btn" type="button" disabled={!value.trim()} onClick={onPublish}>Publish</button>
        </div>
      </div>
    </section>
  );
}
