# Expanse - Space Battle Game

A realistic space battle game built with Three.js, React, and Vite.

## Features

- Realistic space physics (no automatic slowdown, need to use reverse thrusters)
- Near-future spacecraft aesthetics
- Realistic weapons (machine guns and rockets)
- Solar system setting with planets in the background
- Keyboard and mouse controls

## Controls

- **W/A/S/D**: Move spacecraft (forward/left/backward/right)
- **Arrow Keys**: Rotate spacecraft
- **Q**: Switch between machine guns and rockets
- **Spacebar**: Fire current weapon

## Physics

The game implements realistic space physics:
- No automatic slowdown when not accelerating
- Need to use reverse thrusters to slow down
- No atmospheric drag
- Realistic momentum

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

## Technologies Used

- Three.js for 3D rendering
- React Three Fiber for integrating Three.js with React
- React Three Cannon for physics simulation
- TypeScript for type safety
- Vite for fast development

## Future Enhancements

- Enemy spacecraft
- Ability to land on planets
- Mission system
- Multiplayer mode
- More detailed spacecraft models
- Damage system

## License

MIT
