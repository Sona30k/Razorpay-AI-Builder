"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three";
import { GLOBE_RADIUS, latLonToSphereVector } from "@/lib/constants";

export type CityMarkerProps = {
    city: {
        id: string;
        name: string;
        lat: number;
        lon: number;
    };
    isSelected: boolean;
    onSelect: (cityId: string) => void;
};

export function CityMarker({ city, isSelected, onSelect }: CityMarkerProps) {
    const [hovered, setHovered] = useState(false);
    const [labelVisible, setLabelVisible] = useState(true);
    const { camera } = useThree();
    const labelVisibleRef = useRef(true);

    const markerPosition = useMemo(() => {
        const point = latLonToSphereVector(city.lat, city.lon, GLOBE_RADIUS + 0.06);
        return [point.x, point.y, point.z] as [number, number, number];
    }, [city.lat, city.lon]);

    const labelOffset = useMemo(() => {
        const offsets: Record<string, [number, number, number]> = {
            delhi: [0.2, 0.2, 0],
            gurugram: [-0.18, 0.06, 0],
            pune: [-0.14, 0.1, 0],
            hyderabad: [-0.12, 0.08, 0],
            bengaluru: [0.1, -0.1, 0]
        };

        return offsets[city.id] ?? [0.1, 0.08, 0];
    }, [city.id]);

    const labelPosition = useMemo(() => {
        const offset = new Vector3(...labelOffset).multiplyScalar(0.75);
        return [offset.x, offset.y, offset.z] as [number, number, number];
    }, [labelOffset]);

    const displayName = useMemo(() => {
        const names: Record<string, string> = {
            delhi: "Delhi",
            gurugram: "Gurugram",
            pune: "Pune",
            hyderabad: "Hyderabad",
            bengaluru: "Bengaluru"
        };

        return names[city.id] ?? city.name;
    }, [city.id, city.name]);

    useFrame(() => {
        const markerVector = new Vector3(...markerPosition);
        const normal = markerVector.clone().normalize();
        const toCamera = camera.position.clone().sub(markerVector);
        const facingCamera = normal.dot(toCamera.normalize()) > 0.02;

        if (labelVisibleRef.current !== facingCamera) {
            labelVisibleRef.current = facingCamera;
            setLabelVisible(facingCamera);
        }
    });

    const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
    };

    const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "default";
    };

    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(city.id);
    };

    return (
        <group position={markerPosition}>
            <mesh
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <sphereGeometry args={[hovered || isSelected ? 0.024 : 0.018, 18, 18]} />
                <meshStandardMaterial
                    color={isSelected ? "#f8fafc" : hovered ? "#dbeafe" : "#dfeaf8"}
                    emissive={isSelected ? "#7dd3fc" : hovered ? "#7dd3fc" : "#93c5fd"}
                    emissiveIntensity={isSelected ? 1.6 : hovered ? 1.1 : 0.8}
                    transparent
                    opacity={1}
                />
            </mesh>

            <mesh>
                <sphereGeometry args={[hovered || isSelected ? 0.048 : 0.038, 18, 18]} />
                <meshBasicMaterial color="#7dd3fc" transparent opacity={hovered || isSelected ? 0.12 : 0.08} />
            </mesh>

            <Html
                position={labelPosition}
                center
                sprite
                transform={false}
                style={{
                    pointerEvents: "none",
                    opacity: labelVisible ? 1 : 0,
                    transition: "opacity 0.15s ease"
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px 5px",
                        borderRadius: "6px",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        background: "rgba(15, 23, 42, 0.7)",
                        boxShadow: "0 8px 18px rgba(2, 6, 23, 0.22)",
                        fontSize: "clamp(10px, 0.72vw, 12px)",
                        lineHeight: 1.2,
                        fontWeight: 600,
                        color: isSelected ? "#f8fafc" : hovered ? "#dbeafe" : "#e2e8f0",
                        whiteSpace: "nowrap",
                        letterSpacing: "0",
                        textShadow: "0 1px 2px rgba(15, 23, 42, 0.85)",
                        transform: "translateY(-1px)"
                    }}
                >
                    {displayName}
                </div>
            </Html>
        </group>
    );
}
