import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group } from "three";

interface RocketProps {
  position: [number, number, number];
  isFiring: boolean;
}

export const Rocket = ({ position, isFiring }: RocketProps) => {
  const ref = useRef<Group>(null);
  const [rockets, setRockets] = useState<
    Array<{
      id: number;
      position: Vector3;
      velocity: Vector3;
      createdAt: number;
    }>
  >([]);
  const [lastFired, setLastFired] = useState(0);
  const rocketSpeed = 50;
  const fireRate = 1000; // milliseconds between shots

  // Handle firing
  useEffect(() => {
    if (isFiring && Date.now() - lastFired > fireRate && ref.current) {
      const launcherPosition = new Vector3(
        position[0],
        position[1],
        position[2]
      );

      // Get the forward direction from the launcher
      const direction = new Vector3(0, 0, -1);

      // Create a new rocket
      const newRocket = {
        id: Date.now() + Math.random(), // Ensure unique ID
        position: launcherPosition.clone(),
        velocity: direction.multiplyScalar(rocketSpeed),
        createdAt: Date.now(),
      };

      setRockets((prev) => [...prev, newRocket]);
      setLastFired(Date.now());

      // Play sound effect
      const audio = new Audio("/sounds/rocket.mp3");
      audio.volume = 0.4;
      audio.play().catch((e) => console.log("Audio play failed:", e));
    }
  }, [isFiring, lastFired, position, rocketSpeed, fireRate]);

  // Update rocket positions and remove old rockets
  useFrame((_, delta) => {
    setRockets(
      (prev) =>
        prev
          .map((rocket) => ({
            ...rocket,
            position: rocket.position
              .clone()
              .add(rocket.velocity.clone().multiplyScalar(delta)),
          }))
          .filter((rocket) => Date.now() - rocket.createdAt < 5000) // Remove rockets after 5 seconds
    );
  });

  return (
    <group ref={ref} position={position}>
      {/* Rocket launcher model */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rockets */}
      {rockets.map((rocket) => (
        <group key={rocket.id} position={rocket.position.toArray()}>
          {/* Rocket body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
            <meshStandardMaterial
              color="#555"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Rocket nose */}
          <mesh castShadow position={[0, 0.3, 0]}>
            <coneGeometry args={[0.1, 0.2, 8]} />
            <meshStandardMaterial
              color="#555"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Rocket engine glow */}
          <pointLight
            position={[0, -0.3, 0]}
            distance={2}
            intensity={2}
            color="#ff4400"
          />
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff4400"
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
