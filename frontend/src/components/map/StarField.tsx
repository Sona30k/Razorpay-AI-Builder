"use client";

import { Stars } from "@react-three/drei";

export function StarField() {
  return (
    <Stars
      radius={85}
      depth={28}
      count={620}
      factor={1.55}
      saturation={0}
      fade
      speed={0.04}
    />
  );
}
