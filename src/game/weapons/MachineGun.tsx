import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group } from "three";

interface MachineGunProps {
  position: [number, number, number];
  isFiring: boolean;
}

export const MachineGun = ({ position, isFiring }: MachineGunProps) => {
  const ref = useRef<Group>(null);
  const [bullets, setBullets] = useState<
    Array<{
      id: number;
      position: Vector3;
      velocity: Vector3;
      createdAt: number;
    }>
  >([]);
  const [lastFired, setLastFired] = useState(0);
  const bulletSpeed = 100;
  const fireRate = 100; // milliseconds between shots

  // Handle firing
  useEffect(() => {
    const fireBullet = () => {
      if (!ref.current) return;

      const gunPosition = new Vector3(position[0], position[1], position[2]);

      // Get the forward direction from the gun
      const direction = new Vector3(0, 0, -1);

      // Create a new bullet
      const newBullet = {
        id: Date.now() + Math.random(), // Ensure unique ID
        position: gunPosition.clone(),
        velocity: direction.multiplyScalar(bulletSpeed),
        createdAt: Date.now(),
      };

      setBullets((prev) => [...prev, newBullet]);
      setLastFired(Date.now());

      // Play sound effect
      const audio = new Audio("/sounds/machinegun.mp3");
      audio.volume = 0.3;
      audio.play().catch((e) => console.log("Audio play failed:", e));
    };

    // Set up interval for continuous firing
    let interval: number | null = null;

    if (isFiring) {
      // Fire immediately
      if (Date.now() - lastFired > fireRate) {
        fireBullet();
      }

      // Set up interval for continuous firing
      interval = window.setInterval(() => {
        fireBullet();
      }, fireRate);
    }

    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isFiring, lastFired, position, fireRate, bulletSpeed]);

  // Update bullet positions and remove old bullets
  useFrame((_, delta) => {
    setBullets(
      (prev) =>
        prev
          .map((bullet) => ({
            ...bullet,
            position: bullet.position
              .clone()
              .add(bullet.velocity.clone().multiplyScalar(delta)),
          }))
          .filter((bullet) => Date.now() - bullet.createdAt < 2000) // Remove bullets after 2 seconds
    );
  });

  return (
    <group ref={ref} position={position}>
      {/* Machine gun model */}
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.2, 0.8]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Bullets */}
      {bullets.map((bullet) => (
        <mesh key={bullet.id} position={bullet.position.toArray()}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={0.5}
          />
          <pointLight distance={2} intensity={1} color="#ffff00" />
        </mesh>
      ))}
    </group>
  );
};
