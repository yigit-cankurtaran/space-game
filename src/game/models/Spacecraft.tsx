import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Vector3 } from "three";
import { useGameState } from "../utils/GameContext";
import { MachineGun } from "../weapons/MachineGun";
import { Rocket } from "../weapons/Rocket";

// Add a global declaration for our keyMap
declare global {
  interface Window {
    keyMap?: Record<string, boolean>;
  }
}

interface SpacecraftProps {
  position?: [number, number, number];
}

const Spacecraft = ({ position = [0, 0, 0] }: SpacecraftProps) => {
  const { currentWeapon, updateSpeed, updateVelocity } = useGameState();
  const [velocity, setVelocity] = useState<Vector3>(new Vector3(0, 0, 0));
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isFiring, setIsFiring] = useState(false);

  // Physics body for the spacecraft
  const [ref, api] = useBox(() => ({
    mass: 500,
    position,
    linearDamping: 0, // No damping in space
    angularDamping: 0.5, // Some damping for rotation to make control easier
    type: "Dynamic",
  }));

  // Store velocity for use in rendering and update GameContext
  useFrame(() => {
    api.velocity.subscribe((v: [number, number, number]) => {
      const newVelocity = new Vector3(v[0], v[1], v[2]);
      setVelocity(newVelocity);

      // Calculate speed (magnitude of velocity vector)
      const speed = newVelocity.length();
      updateSpeed(Math.round(speed * 10) / 10); // Round to 1 decimal place
      updateVelocity(newVelocity);
    });
    api.rotation.subscribe((r: [number, number, number]) => {
      setRotation([r[0], r[1], r[2]]);
    });
  });

  // Handle keyboard controls and camera positioning
  useFrame(({ camera }) => {
    const keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      " ": false, // Space bar for firing
    };

    // Check which keys are pressed
    Object.keys(keys).forEach((key) => {
      if (window.keyMap) {
        keys[key as keyof typeof keys] = window.keyMap[key] || false;
      }
    });

    // Apply forces based on key presses
    const force = 50; // Acceleration force
    const impulse: [number, number, number] = [0, 0, 0];

    if (keys.w) impulse[2] = -force; // Forward
    if (keys.s) impulse[2] = force; // Backward
    if (keys.a) impulse[0] = -force; // Left
    if (keys.d) impulse[0] = force; // Right
    if (keys.ArrowUp) impulse[1] = force; // Up
    if (keys.ArrowDown) impulse[1] = -force; // Down

    // Apply rotation
    const torque = 10;
    const rotationImpulse: [number, number, number] = [0, 0, 0];

    if (keys.ArrowLeft) rotationImpulse[1] = torque; // Rotate left
    if (keys.ArrowRight) rotationImpulse[1] = -torque; // Rotate right

    // Apply forces
    if (impulse.some((v) => v !== 0)) {
      api.applyLocalForce(impulse, [0, 0, 0]);
    }

    // Apply torque
    if (rotationImpulse.some((v) => v !== 0)) {
      api.applyTorque(rotationImpulse);
    }

    // Update firing state
    setIsFiring(keys[" "]);

    // Update camera position to follow the spacecraft
    if (ref.current) {
      const spacecraftPosition = ref.current.position;

      // Position the camera behind and slightly above the spacecraft
      const cameraOffset = new Vector3(0, 3, 10);
      const targetPosition = new Vector3(
        spacecraftPosition.x,
        spacecraftPosition.y,
        spacecraftPosition.z
      );

      // Apply the offset
      const cameraPosition = targetPosition.clone().add(cameraOffset);
      camera.position.lerp(cameraPosition, 0.1); // Smooth camera movement
      camera.lookAt(
        spacecraftPosition.x,
        spacecraftPosition.y,
        spacecraftPosition.z
      );
    }
  });

  // Add a spotlight to illuminate the spacecraft
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Add a light that moves with the spacecraft */}
      <pointLight
        position={[0, 3, 0]}
        intensity={1}
        distance={10}
        color="#ffffff"
      />

      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 4]} />
        <meshStandardMaterial
          color="#666"
          metalness={0.6}
          roughness={0.3}
          emissive="#222222"
        />
      </mesh>

      {/* Cockpit */}
      <mesh castShadow receiveShadow position={[0, 0.5, -0.5]}>
        <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#88ccff"
          transparent
          opacity={0.7}
          metalness={0.2}
          roughness={0}
          emissive="#113355"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Wings */}
      <mesh castShadow receiveShadow position={[1.5, 0, 0]}>
        <boxGeometry args={[1.5, 0.1, 2]} />
        <meshStandardMaterial
          color="#777"
          metalness={0.5}
          roughness={0.4}
          emissive="#222222"
        />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.5, 0, 0]}>
        <boxGeometry args={[1.5, 0.1, 2]} />
        <meshStandardMaterial
          color="#777"
          metalness={0.5}
          roughness={0.4}
          emissive="#222222"
        />
      </mesh>

      {/* Engines */}
      <mesh castShadow receiveShadow position={[1, -0.2, 1.5]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 16]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1, -0.2, 1.5]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 16]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engine glow when accelerating forward */}
      {velocity.z < -0.1 && (
        <>
          <pointLight
            position={[1, -0.2, 2]}
            distance={3}
            intensity={5}
            color="#ff4400"
          />
          <pointLight
            position={[-1, -0.2, 2]}
            distance={3}
            intensity={5}
            color="#ff4400"
          />
        </>
      )}

      {/* Engine glow when accelerating backward */}
      {velocity.z > 0.1 && (
        <>
          <pointLight
            position={[1, -0.2, 1]}
            distance={3}
            intensity={5}
            color="#ff4400"
          />
          <pointLight
            position={[-1, -0.2, 1]}
            distance={3}
            intensity={5}
            color="#ff4400"
          />
        </>
      )}

      {/* Weapons */}
      {currentWeapon === "machineGun" ? (
        <MachineGun position={[0, -0.2, -2]} isFiring={isFiring} />
      ) : (
        <Rocket position={[0, -0.2, -2]} isFiring={isFiring} />
      )}
    </group>
  );
};

export default Spacecraft;
