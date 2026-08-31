"use client";

export function CityRoads() {
  return (
    <group position={[0, 0.012, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17, 0.34]} />
        <meshBasicMaterial color="#263b4e" transparent opacity={0.78} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0.56, 0]}>
        <planeGeometry args={[18, 0.28]} />
        <meshBasicMaterial color="#203547" transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, -0.72, 0]}>
        <planeGeometry args={[15, 0.22]} />
        <meshBasicMaterial color="#1c3042" transparent opacity={0.72} />
      </mesh>
    </group>
  );
}
