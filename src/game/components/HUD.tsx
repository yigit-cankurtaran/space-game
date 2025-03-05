import { useEffect } from "react";
import { useGameState } from "../utils/GameContext";

const HUD = () => {
  const { health, currentWeapon, switchWeapon, speed, velocity } =
    useGameState();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q") {
        switchWeapon();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [switchWeapon]);

  // Calculate direction for display
  const getDirectionText = () => {
    if (!velocity) return "Stationary";

    const threshold = 0.5;
    const directions = [];

    if (velocity.z < -threshold) directions.push("Forward");
    if (velocity.z > threshold) directions.push("Backward");
    if (velocity.x > threshold) directions.push("Right");
    if (velocity.x < -threshold) directions.push("Left");
    if (velocity.y > threshold) directions.push("Up");
    if (velocity.y < -threshold) directions.push("Down");

    return directions.length > 0 ? directions.join(" + ") : "Drifting";
  };

  return (
    <div className="hud">
      <div className="hud-element health-indicator">Health: {health}%</div>
      <div className="hud-element weapon-indicator">
        Weapon: {currentWeapon === "machineGun" ? "Machine Gun" : "Rockets"}
      </div>
      <div className="hud-element speed-indicator">
        <div>Speed: {speed} m/s</div>
        <div>Direction: {getDirectionText()}</div>
      </div>
      <div className="crosshair"></div>
    </div>
  );
};

export default HUD;
