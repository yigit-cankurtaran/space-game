import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

interface PlanetData {
  name: string;
  size: number;
  distance: number;
  color: string;
  emissive?: boolean;
  rotationSpeed: number;
  hasRings?: boolean;
}

interface PlanetProps {
  size: number;
  distance: number;
  color: string;
  emissive?: boolean;
  rotationSpeed: number;
  hasRings?: boolean;
  orbitAngle: number;
}

// Planet data with relative sizes and distances (not to scale, but representative)
const planets: PlanetData[] = [
  {
    name: "Sun",
    size: 10,
    distance: 0,
    color: "#ffcc33",
    emissive: true,
    rotationSpeed: 0.001,
  },
  {
    name: "Mercury",
    size: 0.4,
    distance: 20,
    color: "#aaa9ad",
    rotationSpeed: 0.005,
  },
  {
    name: "Venus",
    size: 0.9,
    distance: 30,
    color: "#e6e6e6",
    rotationSpeed: 0.004,
  },
  {
    name: "Earth",
    size: 1,
    distance: 40,
    color: "#2b82c9",
    rotationSpeed: 0.003,
  },
  {
    name: "Mars",
    size: 0.5,
    distance: 55,
    color: "#c1440e",
    rotationSpeed: 0.0025,
  },
  {
    name: "Jupiter",
    size: 3,
    distance: 80,
    color: "#e0ae6f",
    rotationSpeed: 0.002,
  },
  {
    name: "Saturn",
    size: 2.5,
    distance: 110,
    color: "#f4d432",
    rotationSpeed: 0.0015,
    hasRings: true,
  },
  {
    name: "Uranus",
    size: 1.8,
    distance: 140,
    color: "#5580aa",
    rotationSpeed: 0.001,
  },
  {
    name: "Neptune",
    size: 1.7,
    distance: 170,
    color: "#366896",
    rotationSpeed: 0.0008,
  },
];

const Planet = ({
  size,
  distance,
  color,
  emissive = false,
  rotationSpeed,
  hasRings = false,
  orbitAngle = 0,
}: PlanetProps) => {
  const ref = useRef(null);

  // Calculate position based on distance and orbit angle
  const x = Math.sin(orbitAngle) * distance;
  const z = Math.cos(orbitAngle) * distance;

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive ? color : "#000000"}
          emissiveIntensity={emissive ? 1 : 0}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {/* Add rings for Saturn */}
      {hasRings && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 2.5, 32]} />
          <meshStandardMaterial
            color="#f4d432"
            transparent
            opacity={0.7}
            side={2} // DoubleSide
          />
        </mesh>
      )}

      {/* Add light for the sun */}
      {emissive && (
        <pointLight color={color} intensity={2} distance={500} decay={2} />
      )}
    </group>
  );
};

const SolarSystem = () => {
  const systemRef = useRef(null);

  // Store orbit angles for each planet
  const orbitAngles = useRef(planets.map(() => Math.random() * Math.PI * 2));

  // Rotate planets in their orbits
  useFrame((_, delta) => {
    planets.forEach((planet, i) => {
      if (i > 0) {
        // Skip the sun
        orbitAngles.current[i] += planet.rotationSpeed * delta;
      }
    });
  });

  return (
    <group ref={systemRef} scale={[5, 5, 5]}>
      {planets.map((planet, i) => (
        <Planet
          key={planet.name}
          size={planet.size}
          distance={planet.distance}
          color={planet.color}
          emissive={planet.emissive}
          rotationSpeed={planet.rotationSpeed}
          hasRings={planet.hasRings}
          orbitAngle={orbitAngles.current[i]}
        />
      ))}
    </group>
  );
};

export default SolarSystem;
