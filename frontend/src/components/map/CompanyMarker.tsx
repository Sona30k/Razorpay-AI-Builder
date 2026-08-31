"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import type { Company } from "@/types/company";
import { Color } from "three";

const METERS_TO_SCENE = 0.014;

function toLocalPoint(lat: number, lon: number, cityLatitude: number, cityLongitude: number) {
    const metersPerLongitude = 111_320 * Math.cos((cityLatitude * Math.PI) / 180);
    return {
        x: (lon - cityLongitude) * metersPerLongitude * METERS_TO_SCENE,
        z: -(lat - cityLatitude) * 110_540 * METERS_TO_SCENE
    };
}

type CompanyMarkerProps = {
    company: Company;
    latitude: number; // city center
    longitude: number; // city center
    offset?: { x: number; z: number };
    onSelect?: (c: Company | null) => void;
    selectedCompanyId?: string | null;
};

export function CompanyMarker({ company, latitude, longitude, offset = { x: 0, z: 0 }, onSelect, selectedCompanyId }: CompanyMarkerProps) {
    const ref = useRef<any>(null);
    const [hovered, setHovered] = useState(false);

    const pos = useMemo(() => {
        const local = toLocalPoint(company.latitude!, company.longitude!, latitude, longitude);
        return { x: local.x + offset.x, z: local.z + offset.z };
    }, [company, latitude, longitude, offset]);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.8;
    });

    const isSelected = selectedCompanyId ? company.id === selectedCompanyId : false;

    return (
        <group position={[pos.x, 0.06, pos.z] as any}>
            <mesh
                ref={ref}
                scale={isSelected ? [1.45, 1.45, 1.45] : (hovered ? [1.25, 1.25, 1.25] : [1, 1, 1])}
                onClick={(e) => { e.stopPropagation(); onSelect?.(company); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[0.052, 16, 16]} />
                <meshStandardMaterial
                    color={new Color(hovered ? '#7dd3fc' : '#38bdf8')}
                    emissive={hovered ? '#1e90ff' : '#0ea5e9'}
                    roughness={0.35}
                    metalness={0.2}
                />
            </mesh>

            <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.12, 0.18, 32]} />
                <meshBasicMaterial color={hovered ? '#0ea5e9' : '#0b1220'} transparent opacity={0.22} />
            </mesh>

            {(hovered || isSelected) ? (
                <Html center style={{ pointerEvents: "auto" }} position={[0, 0.36, 0]}>
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelect?.(company); }}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-lg transition-transform duration-150 ${hovered ? 'scale-105' : 'scale-100'}`}
                        style={{ background: 'rgba(3,7,18,0.78)', color: '#e6f6ff', border: '1px solid rgba(56,189,248,0.08)', fontSize: 12, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(2,6,23,0.45)' }}
                    >
                        {company.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={company.logo} alt={company.name} style={{ width: 18, height: 18, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
                        ) : (
                            <div style={{ width: 18, height: 18, borderRadius: 6, background: '#0b1220', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{company.name?.charAt(0) ?? '?'}</div>
                        )}
                        <div style={{ color: '#e6f6ff', fontWeight: 600 }}>{company.name}</div>
                    </div>
                </Html>
            ) : null}
        </group>
    );
}
