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
  SphereGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  TextureLoader,
  CubeTextureLoader,
  Vector3,
} from "three";
import Spacecraft from "../models/Spacecraft";
import SolarSystem from "./SolarSystem";
import { useGameState } from "../utils/GameContext";

// Create a true skybox that doesn't move with the camera
const Skybox = () => {
  const { scene } = useThree();

  useEffect(() => {
    // Create a large cube for the skybox
    const size = 5000;
    const skyboxGeometry = new BoxGeometry(size, size, size);

    // Create a material that's visible from the inside
    const skyboxMaterial = new MeshBasicMaterial({
      color: 0x000000,
      side: BackSide,
    });

    // Create the skybox mesh
    const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);

    // Add stars to the skybox
    const starCount = 5000;
    const starGeometry = new BufferGeometry();
    const starPositions = [];
    const starSizes = [];

    // Generate random stars
    for (let i = 0; i < starCount; i++) {
      // Random position on the inside of the cube
      const x = (Math.random() - 0.5) * size * 0.95;
      const y = (Math.random() - 0.5) * size * 0.95;
      const z = (Math.random() - 0.5) * size * 0.95;

      starPositions.push(x, y, z);

      // Random size for the stars
      starSizes.push(Math.random() * 2 + 1);
    }

    starGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute("size", new Float32BufferAttribute(starSizes, 1));

    // Create a material for the stars
    const starMaterial = new PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });

    // Create the star points
    const stars = new Points(starGeometry, starMaterial);
    scene.add(stars);

    return () => {
      scene.remove(skybox);
      scene.remove(stars);
      skyboxGeometry.dispose();
      skyboxMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, [scene]);

  return null;
};

const GameScene = () => {
  const { scene, camera } = useThree();
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

  return (
    <>
      {/* Fixed skybox with stars */}
      <Skybox />

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
        <Spacecraft ref={spacecraftRef} position={[0, 0, 0]} />
        <SolarSystem />
      </Physics>
    </>
  );
};

export default GameScene;
