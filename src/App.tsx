import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import "./App.css";
import GameScene from "./game/components/GameScene";
import HUD from "./game/components/HUD";
import { GameProvider } from "./game/utils/GameContext";

function App() {
  return (
    <div className="game-container">
      <GameProvider>
        <Canvas shadows camera={{ position: [0, 5, 15], fov: 75 }}>
          <Suspense fallback={null}>
            <Stars
              radius={100}
              depth={50}
              count={5000}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />
            <GameScene />
          </Suspense>
        </Canvas>
        <HUD />
      </GameProvider>
    </div>
  );
}

export default App;
