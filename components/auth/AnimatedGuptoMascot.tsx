"use client";

import Image from "next/image";

type AnimatedGuptoMascotProps = {
  coveringEyes: boolean;
};

export default function AnimatedGuptoMascot({
  coveringEyes,
}: AnimatedGuptoMascotProps) {
  return (
    <div
      className={`auth-animated-brand${coveringEyes ? " is-covering" : ""}`}
      aria-label="Gupto"
    >
      <span className="auth-mascot-stage" aria-hidden="true">
        <Image
          className="auth-mascot-layer auth-mascot-body"
          src="/images/brand/animated-gupto/gupto-mascot-body.png"
          alt=""
          fill
          sizes="90px"
          priority
        />
        <Image
          className="auth-mascot-layer auth-mascot-wing auth-mascot-wing-left"
          src="/images/brand/animated-gupto/gupto-mascot-left-wing.png"
          alt=""
          fill
          sizes="90px"
          priority
        />
        <Image
          className="auth-mascot-layer auth-mascot-wing auth-mascot-wing-right"
          src="/images/brand/animated-gupto/gupto-mascot-right-wing.png"
          alt=""
          fill
          sizes="90px"
          priority
        />
      </span>
      <span className="auth-animated-brand-name">Gupto</span>
    </div>
  );
}
