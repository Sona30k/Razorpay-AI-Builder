"use client";

import { Line } from "@react-three/drei";

export function CityBoundary() {
  return (
    <Line
      points={[
        [-7.8, 0.03, -6.6],
        [7.8, 0.03, -6.6],
        [7.8, 0.03, 6.6],
        [-7.8, 0.03, 6.6],
        [-7.8, 0.03, -6.6]
      ]}
      color="#4f6f8b"
      transparent
      opacity={0.38}
      lineWidth={1}
    />
  );
}
