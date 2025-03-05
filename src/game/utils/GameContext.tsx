import { createContext, useContext, useState, ReactNode } from "react";
import { Vector3 } from "three";

export type WeaponType = "machineGun" | "rocket";

interface GameState {
  health: number;
  currentWeapon: WeaponType;
  speed: number;
  velocity: Vector3;
  switchWeapon: () => void;
  updateSpeed: (newSpeed: number) => void;
  updateVelocity: (newVelocity: Vector3) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const useGameState = (): GameState => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameState must be used within a GameProvider");
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [health, setHealth] = useState(100);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("machineGun");
  const [speed, setSpeed] = useState(0);
  const [velocity, setVelocity] = useState(new Vector3(0, 0, 0));

  const switchWeapon = () => {
    setCurrentWeapon((prev) =>
      prev === "machineGun" ? "rocket" : "machineGun"
    );
  };

  const updateSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const updateVelocity = (newVelocity: Vector3) => {
    setVelocity(newVelocity);
  };

  const value = {
    health,
    currentWeapon,
    speed,
    velocity,
    switchWeapon,
    updateSpeed,
    updateVelocity,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
