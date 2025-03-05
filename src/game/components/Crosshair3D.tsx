import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, Euler } from "three";

interface Crosshair3DProps {
  spacecraftRef: React.RefObject<Group>;
  distance?: number;
  size?: number;
  color?: string;
}

const Crosshair3D = ({
  spacecraftRef,
  distance = 20,
  size = 0.5,
  color = "#00aaff",
}: Crosshair3DProps) => {
  const crosshairRef = useRef<Group>(null);

  // Fixed crosshair position in front of the spacecraft
  useFrame(() => {
    if (spacecraftRef.current && crosshairRef.current) {
      // Find the actual spacecraft mesh (which is a child of the group)
      const spacecraft = spacecraftRef.current.children[0]; // First child is the physics group

      if (spacecraft) {
        // Get spacecraft position and rotation
        const spacecraftPosition = spacecraft.position;
        const spacecraftRotation = spacecraft.rotation;

        // Fixed position in front of the spacecraft
        // This is in local space relative to the spacecraft
        const localPosition = new Vector3(0, 0, -distance);

        // Reset crosshair position and rotation
        crosshairRef.current.position.set(0, 0, 0);
        crosshairRef.current.rotation.set(0, 0, 0);

        // Parent the crosshair directly to the spacecraft
        // This will make it move and rotate with the spacecraft automatically
        if (crosshairRef.current.parent !== spacecraft) {
          spacecraft.add(crosshairRef.current);
        }

        // Set the local position
        crosshairRef.current.position.copy(localPosition);
      }
    }
  });

  return (
    <group ref={crosshairRef}>
      {/* Horizontal line */}
      <mesh>
        <boxGeometry args={[size, size / 10, size / 10]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Vertical line */}
      <mesh>
        <boxGeometry args={[size / 10, size, size / 10]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[size / 8, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Add a point light to make the crosshair more visible */}
      <pointLight distance={2} intensity={0.5} color={color} />
    </group>
  );
};

export default Crosshair3D;
