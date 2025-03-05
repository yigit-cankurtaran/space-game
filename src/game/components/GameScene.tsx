import { useEffect, useRef } from "react";
import { Physics } from "@react-three/cannon";
import { useThree, useFrame } from "@react-three/fiber";
import {
  PointLight,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Clock,
  Group,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  BackSide,
} from "three";
import Spacecraft from "../models/Spacecraft";
import SolarSystem from "./SolarSystem";
import { useGameState } from "../utils/GameContext";

// Match the boundary size with the one in Spacecraft.tsx
const BOUNDARY_SIZE = 500;

const GameScene = () => {
  const { scene } = useThree();
  const { switchWeapon, updateFPS } = useGameState();
  const clock = useRef(new Clock());
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(0);
  const spacecraftRef = useRef<Group>(null);

  // Calculate FPS
  useFrame(() => {
    frameCount.current++;
    const elapsedTime = clock.current.getElapsedTime();

    // Update FPS every 0.5 seconds
    if (elapsedTime - lastFpsUpdate.current >= 0.5) {
      const fps = Math.round(
        frameCount.current / (elapsedTime - lastFpsUpdate.current)
      );
      updateFPS(fps);
      frameCount.current = 0;
      lastFpsUpdate.current = elapsedTime;
    }
  });

  // Set up keyboard controls
  useEffect(() => {
    // Create a key map to track pressed keys
    window.keyMap = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      window.keyMap![e.key] = true;

      // Switch weapons with Q key
      if (e.key.toLowerCase() === "q") {
        switchWeapon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      window.keyMap![e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.keyMap = undefined;
    };
  }, [switchWeapon]);

  // Set up mouse controls for aiming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // We'll implement aiming in a future version
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Add lights to the scene
  useEffect(() => {
    // Ambient light for general illumination - increase intensity
    const ambientLight = new AmbientLight(0x555555, 1);
    scene.add(ambientLight);

    // Hemisphere light for better environmental lighting
    const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);

    // Directional light to simulate the sun - increase intensity
    const sunLight = new DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 10, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Add a fill light from the opposite direction
    const fillLight = new DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(hemisphereLight);
      scene.remove(sunLight);
      scene.remove(fillLight);
    };
  }, [scene]);

  // Add boundary visualization
  useEffect(() => {
    // Create a large cube to represent the boundary
    const boundaryGeometry = new BoxGeometry(
      BOUNDARY_SIZE * 2,
      BOUNDARY_SIZE * 2,
      BOUNDARY_SIZE * 2
    );

    // Create a material that's visible from the inside
    const boundaryMaterial = new MeshBasicMaterial({
      color: 0x0088ff,
      side: BackSide,
      transparent: true,
      opacity: 0.05,
      wireframe: true,
    });

    const boundaryMesh = new Mesh(boundaryGeometry, boundaryMaterial);
    scene.add(boundaryMesh);

    return () => {
      scene.remove(boundaryMesh);
      boundaryGeometry.dispose();
      boundaryMaterial.dispose();
    };
  }, [scene]);

  return (
    <>
      <Physics
        gravity={[0, 0, 0]}
        defaultContactMaterial={{
          friction: 0,
          restitution: 0.7,
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3,
        }}
        iterations={20}
        allowSleep={false}
        broadphase="SAP"
        stepSize={1 / 120}
      >
        <Spacecraft ref={spacecraftRef} />
        <SolarSystem />
      </Physics>
    </>
  );
};

export default GameScene;
