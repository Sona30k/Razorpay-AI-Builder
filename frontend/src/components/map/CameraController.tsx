"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { ElementRef } from "react";
import { Vector3 } from "three";
import {
  GLOBE_RADIUS,
  INDIA_CENTER,
  INDIA_FOCUS_GROUP_ROTATION_Y,
  latLonToSphereVector
} from "@/lib/constants";

type CameraControllerProps = {
  onFocusProgress: (progress: number) => void;
  onAnimationComplete: () => void;
  controlsEnabled: boolean;
  focusTarget?: Vector3 | null;
  cityMode?: boolean;
  objectFocus?: Vector3 | null;
};

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function latLonToFocusedVector(lat: number, lon: number, radius: number) {
  const point = latLonToSphereVector(lat, lon, radius);

  return new Vector3(point.x, point.y, point.z).applyAxisAngle(
    new Vector3(0, 1, 0),
    INDIA_FOCUS_GROUP_ROTATION_Y
  );
}

export function CameraController({
  onFocusProgress,
  onAnimationComplete,
  controlsEnabled,
  focusTarget,
  cityMode = false
  , objectFocus = null
}: CameraControllerProps) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);
  const hasCompletedRef = useRef(false);
  const targetRef = useRef<Vector3 | null>(focusTarget ?? null);
  const modeRef = useRef(cityMode);
  const transitionRef = useRef<{ startedAt: number; from: Vector3; fromTarget: Vector3 } | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    targetRef.current = focusTarget ?? null;
  }, [focusTarget]);

  const positions = useMemo(() => {
    const target = latLonToFocusedVector(INDIA_CENTER.lat, INDIA_CENTER.lon, GLOBE_RADIUS + 0.2);
    const normal = target.clone().normalize();

    return {
      start: normal.clone().multiplyScalar(12),
      end: normal.clone().multiplyScalar(7.2),
      lookAt: target.clone().multiplyScalar(1.04)
    };
  }, []);

  useFrame(({ clock }) => {
    if (modeRef.current !== cityMode) {
      modeRef.current = cityMode;
      transitionRef.current = {
        startedAt: clock.elapsedTime,
        from: camera.position.clone(),
        fromTarget: controlsRef.current?.target.clone() ?? new Vector3()
      };
    }

    if (transitionRef.current) {
      const transition = transitionRef.current;
      const progress = Math.min((clock.elapsedTime - transition.startedAt) / 1.65, 1);
      const eased = easeInOutCubic(progress);
      const destinationTarget = cityMode ? new Vector3(0, 0.28, 0) : positions.lookAt;
      const destination = cityMode ? destinationTarget.clone().add(new Vector3(6.4, 5.6, 7.2)) : positions.end;

      camera.position.copy(transition.from.clone().lerp(destination, eased));
      controlsRef.current?.target.copy(transition.fromTarget.clone().lerp(destinationTarget, eased));
      camera.lookAt(destinationTarget);

      if (progress === 1) transitionRef.current = null;
      return;
    }

    if (cityMode) {
      // If there's an object to focus (company marker), smoothly move camera toward it
      if (objectFocus && controlsEnabled) {
        const desiredLookAt = objectFocus.clone();
        // choose a camera offset that keeps context visible
        const desiredPosition = objectFocus.clone().add(new Vector3(0.4, 2.8, 4.8));

        camera.position.lerp(desiredPosition, 0.06);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(desiredLookAt, 0.08);
          controlsRef.current.update();
        }

        camera.lookAt(desiredLookAt);
        return;
      }

      controlsRef.current?.update();
      return;
    }

    if (targetRef.current && controlsEnabled) {
      const desiredPosition = targetRef.current.clone().normalize().multiplyScalar(7.1);
      const desiredLookAt = targetRef.current.clone().multiplyScalar(1.02);

      camera.position.lerp(desiredPosition, 0.04);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredLookAt, 0.06);
        controlsRef.current.update();
      }

      camera.lookAt(desiredLookAt);
      onFocusProgress(1);
      return;
    }

    if (hasCompletedRef.current) {
      controlsRef.current?.update();
      return;
    }

    const rawProgress = Math.min(clock.elapsedTime / 5.2, 1);
    const easedProgress = easeInOutCubic(rawProgress);
    const cameraPosition = positions.start.clone().lerp(positions.end, easedProgress);
    const lookTarget = new Vector3(0, 0, 0).lerp(positions.lookAt, easedProgress);

    camera.position.copy(cameraPosition);
    camera.lookAt(lookTarget);
    onFocusProgress(Math.max(0, (rawProgress - 0.34) / 0.66));

    if (rawProgress >= 1) {
      hasCompletedRef.current = true;
      controlsRef.current?.target.copy(positions.lookAt);
      controlsRef.current?.update();
      onAnimationComplete();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.42, 7.4]} fov={38} />
      <OrbitControls
        ref={controlsRef}
        enabled={controlsEnabled}
        enableDamping
        dampingFactor={0.08}
        enablePan={cityMode}
        minDistance={cityMode ? 4.2 : 5.8}
        maxDistance={cityMode ? 18 : 11}
        rotateSpeed={0.42}
        zoomSpeed={0.62}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.15}
      />
    </>
  );
}
