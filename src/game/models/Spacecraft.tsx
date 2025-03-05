import { useRef, useState, useEffect, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Vector3, Group, Object3D, Matrix4 } from "three";
import { useGameState } from "../utils/GameContext";
import { MachineGun } from "../weapons/MachineGun";
import { Rocket } from "../weapons/Rocket";
import Crosshair3D from "../components/Crosshair3D";

// Add a global declaration for our keyMap
declare global {
  interface Window {
    keyMap?: Record<string, boolean>;
  }
}

// Constants
const G_FORCE = 9.8; // 1g acceleration in m/s²
const BOUNDARY_SIZE = 500; // Size of the playable area

// Physics settings to reduce jitter
const PHYSICS_SUBSTEPS = 4; // More substeps for smoother physics
const PHYSICS_PRECISION = 0.0001; // Higher precision for calculations

interface SpacecraftProps {
  position?: [number, number, number];
}

const Spacecraft = forwardRef<Group, SpacecraftProps>(
  ({ position = [0, 0, 0] }, ref) => {
    const { currentWeapon, updateSpeed, updateVelocity } = useGameState();
    const [velocity, setVelocity] = useState<Vector3>(new Vector3(0, 0, 0));
    const [rotation, setRotation] = useState<[number, number, number]>([
      0, 0, 0,
    ]);
    const [isFiring, setIsFiring] = useState(false);
    const internalRef = useRef<Group>(null);

    // Physics body for the spacecraft
    const [physicsRef, api] = useBox(() => ({
      mass: 500,
      position,
      linearDamping: 0, // No damping in space
      angularDamping: 0.5, // Some damping for rotation to make control easier
      type: "Dynamic",
      allowSleep: false, // Never let the physics body sleep
      fixedStep: 1 / 120, // Higher frequency physics updates
      quatNormalizeFast: false, // Use precise quaternion normalization
      quatNormalizeSkip: 1, // Normalize quaternions every frame
    }));

    // Combine refs
    useEffect(() => {
      if (ref && physicsRef.current) {
        if (typeof ref === "function") {
          // Create a Group to pass to the ref function
          if (internalRef.current) {
            internalRef.current.position.copy(physicsRef.current.position);
            internalRef.current.quaternion.copy(physicsRef.current.quaternion);
            ref(internalRef.current);
          }
        } else if (ref.current && internalRef.current) {
          // Update the ref.current with the position and rotation from physicsRef
          internalRef.current.position.copy(physicsRef.current.position);
          internalRef.current.quaternion.copy(physicsRef.current.quaternion);
          ref.current = internalRef.current;
        }
      }
    }, [ref, physicsRef]);

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

      // Check boundaries and prevent going past the stars
      api.position.subscribe((p: [number, number, number]) => {
        const pos = new Vector3(p[0], p[1], p[2]);

        // Check if spacecraft is outside the boundary
        if (
          Math.abs(pos.x) > BOUNDARY_SIZE ||
          Math.abs(pos.y) > BOUNDARY_SIZE ||
          Math.abs(pos.z) > BOUNDARY_SIZE
        ) {
          // Clamp position to boundary
          pos.x = Math.max(-BOUNDARY_SIZE, Math.min(BOUNDARY_SIZE, pos.x));
          pos.y = Math.max(-BOUNDARY_SIZE, Math.min(BOUNDARY_SIZE, pos.y));
          pos.z = Math.max(-BOUNDARY_SIZE, Math.min(BOUNDARY_SIZE, pos.z));

          // Reset position and apply a small opposing force
          api.position.set(pos.x, pos.y, pos.z);

          // Get current velocity and reverse it slightly to create a "bounce" effect
          api.velocity.subscribe((v: [number, number, number]) => {
            const vel = new Vector3(v[0], v[1], v[2]);
            vel.multiplyScalar(-0.5); // Reverse and reduce velocity
            api.velocity.set(vel.x, vel.y, vel.z);
          });
        }
      });

      api.rotation.subscribe((r: [number, number, number]) => {
        setRotation([r[0], r[1], r[2]]);
      });
    });

    // Handle keyboard controls and camera positioning
    useFrame(({ camera }, delta) => {
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

      // Apply forces based on key presses - using 1g acceleration
      // Force = mass * acceleration
      const mass = 500; // kg
      const force = mass * G_FORCE; // N (Newton)
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
      if (physicsRef.current) {
        // Create a matrix from the spacecraft's world transform
        const spacecraftMatrix = new Matrix4();
        physicsRef.current.updateMatrixWorld();
        spacecraftMatrix.copy(physicsRef.current.matrixWorld);

        // Define camera offset in spacecraft's local space (behind and above)
        const localOffset = new Vector3(0, 2, 8);

        // Transform local offset to world space using the spacecraft's matrix
        const worldOffset = localOffset.clone().applyMatrix4(spacecraftMatrix);

        // Get spacecraft position in world space
        const spacecraftWorldPos = new Vector3();
        spacecraftWorldPos.setFromMatrixPosition(spacecraftMatrix);

        // Apply smoothing to camera movement to reduce jitter
        // Lerp between current camera position and target position
        camera.position.lerp(worldOffset, 0.1);

        // Create a smoothed look target
        const lookTarget = new Vector3();
        lookTarget.copy(spacecraftWorldPos);

        // Look at the spacecraft with a slight delay to smooth camera rotation
        camera.lookAt(lookTarget);
      }
    });

    return (
      <>
        {/* Internal ref for forwarding */}
        <group ref={internalRef} />

        {/* Physics-controlled group */}
        <group ref={physicsRef} position={position} rotation={rotation}>
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
            <sphereGeometry
              args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
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
            <meshStandardMaterial
              color="#444"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[-1, -0.2, 1.5]}>
            <cylinderGeometry args={[0.3, 0.4, 1, 16]} />
            <meshStandardMaterial
              color="#444"
              metalness={0.8}
              roughness={0.2}
            />
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

          {/* Fixed crosshair in front of the spacecraft */}
          <group position={[0, 0, -30]}>
            {/* Horizontal line */}
            <mesh>
              <boxGeometry args={[0.8, 0.08, 0.08]} />
              <meshBasicMaterial color="#00aaff" />
            </mesh>

            {/* Vertical line */}
            <mesh>
              <boxGeometry args={[0.08, 0.8, 0.08]} />
              <meshBasicMaterial color="#00aaff" />
            </mesh>

            {/* Center dot */}
            <mesh>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#00aaff" />
            </mesh>

            {/* Add a point light to make the crosshair more visible */}
            <pointLight distance={2} intensity={0.5} color="#00aaff" />
          </group>
        </group>
      </>
    );
  }
);

export default Spacecraft;
