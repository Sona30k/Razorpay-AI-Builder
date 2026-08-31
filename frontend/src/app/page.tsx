"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Loader } from "@/components/loader/Loader";

const TechMap = dynamic(
  () => import("@/components/map/TechMap").then((module) => module.TechMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#050608]" />
  }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const sceneTimer = window.setTimeout(() => setShowScene(true), 120);
      return () => window.clearTimeout(sceneTimer);
    }

    return undefined;
  }, [isLoading]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden atlas-bg">
      {showScene ? (
        <section
          aria-label="TechAtlas 3D environment"
          className="scene-fade-in absolute inset-0"
        >
          <TechMap />
        </section>
      ) : null}

      {isLoading ? <Loader onComplete={() => setIsLoading(false)} /> : null}
    </main>
  );
}
