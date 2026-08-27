"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from "react";
import { DEFAULT_STORY_MEDIA_TRANSFORM, type StoryMediaTransform } from "@/types/story";

type Props = {
  source: string;
  kind: "image" | "video";
  value: StoryMediaTransform;
  onChange: (value: StoryMediaTransform) => void;
  onClose: () => void;
};

export function storyMediaStyle(value: StoryMediaTransform): CSSProperties {
  return {
    objectFit: value.fit === "CONTAIN" ? "contain" : "cover",
    transform: `translate(${value.offsetX}%, ${value.offsetY}%) rotate(${value.rotation}deg) scale(${value.scale * (value.flipX ? -1 : 1)}, ${value.scale * (value.flipY ? -1 : 1)})`,
  };
}

export function storyFrameClass(frame: StoryMediaTransform["frame"]) {
  return `story-media-frame-${frame.toLowerCase()}`;
}

export default function StoryMediaEditor({ source, kind, value, onChange, onClose }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const update = (patch: Partial<StoryMediaTransform>) => onChange({ ...value, ...patch });
  const clamp = (number: number, min: number, max: number) => Math.min(max, Math.max(min, number));
  const rotate = (amount: number) => ((value.rotation + amount + 180) % 360 + 360) % 360 - 180;

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: value.offsetX, offsetY: value.offsetY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!start || !rect) return;
    update({
      offsetX: clamp(start.offsetX + ((event.clientX - start.x) / rect.width) * 100, -60, 60),
      offsetY: clamp(start.offsetY + ((event.clientY - start.y) / rect.height) * 100, -60, 60),
    });
  };
  const pointerUp = () => { dragRef.current = null; setDragging(false); };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    update({ scale: clamp(value.scale + (event.deltaY < 0 ? .08 : -.08), .5, 3) });
  };

  return (
    <div className="story-media-editor-backdrop" role="dialog" aria-modal="true" aria-label="Edit story media">
      <section className="story-media-editor-panel">
        <header><button type="button" onClick={onClose} aria-label="Close editor">×</button><div><span>GUPTO MEDIA LAB</span><h3>Make it fit your story</h3></div><button type="button" className="done" onClick={onClose}>Done</button></header>
        <div className="story-media-editor-body">
          <div className="story-media-editor-canvas"><div ref={stageRef} className={`story-media-stage ${storyFrameClass(value.frame)}${dragging ? " dragging" : ""}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel}>{kind === "video" ? <video className="story-media-canvas-blur" src={source} muted autoPlay loop playsInline aria-hidden="true" /> : <img className="story-media-canvas-blur" src={source} alt="" aria-hidden="true" />}{kind === "video" ? <video className="story-media-foreground" src={source} style={storyMediaStyle(value)} muted autoPlay loop playsInline /> : <img className="story-media-foreground" src={source} style={storyMediaStyle(value)} alt="Edit preview" />}<div className="story-media-grid" /></div><small>Drag to reposition · Scroll to zoom</small></div>
          <div className="story-media-editor-controls">
            <section><div className="story-editor-section-title"><strong>Canvas</strong><small>Choose your composition</small></div><div className="story-segmented two story-canvas-options">{(["PORTRAIT", "LANDSCAPE"] as const).map((frame) => <button key={frame} type="button" className={value.frame === frame ? "active" : ""} onClick={() => update({ frame })}><span className={`story-canvas-icon ${frame === "PORTRAIT" ? "portrait" : "landscape"}`} aria-hidden="true" /><span>{frame === "PORTRAIT" ? "Portrait" : "Landscape"}</span></button>)}</div></section>
            <section><div className="story-editor-section-title"><strong>Fit</strong><small>Show everything or fill the canvas</small></div><div className="story-segmented two"><button type="button" className={value.fit === "CONTAIN" ? "active" : ""} onClick={() => update({ fit: "CONTAIN" })}>Fit</button><button type="button" className={value.fit === "COVER" ? "active" : ""} onClick={() => update({ fit: "COVER" })}>Fill</button></div></section>
            <section><div className="story-editor-section-title"><strong>Zoom</strong><b>{Math.round(value.scale * 100)}%</b></div><input type="range" min={.5} max={3} step={.01} value={value.scale} onChange={(event) => update({ scale: Number(event.target.value) })} /></section>
            <section><div className="story-editor-section-title"><strong>Rotation</strong><b>{Math.round(value.rotation)}°</b></div><input type="range" min={-180} max={180} step={1} value={value.rotation} onChange={(event) => update({ rotation: Number(event.target.value) })} /><div className="story-editor-actions"><button type="button" onClick={() => update({ rotation: rotate(-90) })}>↶ 90°</button><button type="button" onClick={() => update({ rotation: rotate(90) })}>↷ 90°</button></div></section>
            <section><div className="story-editor-section-title"><strong>Mirror</strong><small>Flip your media</small></div><div className="story-editor-actions"><button type="button" className={value.flipX ? "active" : ""} onClick={() => update({ flipX: !value.flipX })}>↔ Horizontal</button><button type="button" className={value.flipY ? "active" : ""} onClick={() => update({ flipY: !value.flipY })}>↕ Vertical</button></div></section>
            <button type="button" className="story-editor-reset" onClick={() => onChange({ ...DEFAULT_STORY_MEDIA_TRANSFORM })}>Reset everything</button>
          </div>
        </div>
      </section>
    </div>
  );
}
