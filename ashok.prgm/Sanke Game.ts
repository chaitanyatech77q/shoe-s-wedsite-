import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Configuration ---
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;

// --- Stage Configuration ---
const STAGES = [
  { level: 1, speed: 400, goal: 5, color: '#48bb78' }, // Stage 1 (Slowest)
  { level: 2, speed: 300, goal: 10, color: '#4299e1' }, // Stage 2
  { level: 3, speed: 250, goal: 15, color: '#9f7aea' }, // Stage 3
  { level: 4, speed: 200, goal: 20, color: '#ed8936' }, // Stage 4
  { level: 5, speed: 150, goal: 25, color: '#f56565' }, // Stage 5 (Fastest)
];

const getRandomCoord = () => ({
  x: Math.floor(Math.random() * TILE_COUNT),
  y: Math.floor(Math.random() * TILE_COUNT),
});


// --- SVG Components for a more "modern" snake ---

const SnakeHead = ({ direction, color }) => {
  const getRotation = () => {
    if (direction.x === 1) return 90;
    if (direction.x === -1) return -90;
    if (direction.y === -1) return 0;
    if (direction.y === 1) return 180;
    return 0; // Default rotation when not moving
  };

  return (
    <div style={{ transform: `rotate(${getRotation()}deg)`, width: '100%', height: '100%', transition: 'transform 0.2s linear' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill={color} />
        <circle cx="30" cy="35" r="10" fill="white" />
        <circle cx="70" cy="35" r="10" fill="white" />
        <circle cx="30" cy="35" r="5" fill="black" />
        <circle cx="70" cy="35" r="5" fill="black" />
      </svg>
    </div>
  );
};

const SnakeBody = ({ color }) => (
    <div style={{
        width: '90%', height: '90%',
        backgroundColor: color,
        borderRadius: '30%',
        boxShadow: `inset 0 0 5px rgba(0,0,0,0.2)`
    }} />
);

const SnakeTail = ({ color, tailDirection }) => {
    const getRotation = () => {
        if (tailDirection.x === 1) return 90;
        if (tailDirection.x === -1) return -90;
        if (tailDirection.y === -1) return 0; // Pointing up
        if (tailDirection.y === 1) return 180; // Pointing down
        return 0;
    };
    return (
        <div style={{ transform: `rotate(${getRotation()}deg)`, width: '100%', height: '100%', transition: 'transform 0.2s linear' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
                 <path d="M 50,90 C 40,70 60,70 50,90 L 50,10 C 40,30 60,30 50,10 Z" fill={color} />
            </svg>
        </div>
    )
}

const Food = ({ color }) => (
    <div style={{
        width: '100%', height: '100%',
        animation: 'pulse 1.5s infinite'
    }}>
         <svg viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 8px yellow)'}}>
            <defs>
                <radialGradient id="gradFood" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                    <stop offset="0%" style={{stopColor: 'white', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor: color, stopOpacity:1}} />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#gradFood)" />
        </svg>
    </div>
);


// --- Main App Component ---
export default function App() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState(getRandomCoord());
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const currentStage = STAGES[stage - 1];
  const gameSpeed = currentStage.speed;
  const snakeColor = currentStage.color;
  const foodColor = STAGES[Math.min(stage, STAGES.length - 1)].color;

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomCoord());
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setStage(1);
    setIsGameOver(false);
    setGameWon(false);
    setIsRunning(true);
  }, []);
  
  const generateFood = useCallback((currentSnake) => {
    let newFoodPosition;
    let isOnSnake = true;
    while(isOnSnake) {
      newFoodPosition = getRandomCoord();
      isOnSnake = currentSnake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y);
    }
    setFood(newFoodPosition);
  }, []);

  const gameLoop = useCallback(() => {
    if (!isRunning || isGameOver) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      if (head.x >= TILE_COUNT || head.x < 0 || head.y >= TILE_COUNT || head.y < 0) {
        setIsGameOver(true); setIsRunning(false); return prevSnake;
      }
      for (let i = 1; i < newSnake.length; i++) {
        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
          setIsGameOver(true); setIsRunning(false); return prevSnake;
        }
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + 1);
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [direction, food, isGameOver, isRunning, generateFood]);

  const handleKeyDown = useCallback((e) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
      if (!isRunning && !isGameOver) setIsRunning(true);
  }, [direction, isRunning, isGameOver]);
  
  const handleTouchControl = (newDirection) => {
      const isOppositeDirection = (newDirection.x !== 0 && newDirection.x === -direction.x) || (newDirection.y !== 0 && newDirection.y === -direction.y);
      if (!isOppositeDirection) setDirection(newDirection);
      if (!isRunning && !isGameOver) setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(gameLoop, gameSpeed);
    return () => clearInterval(interval);
  }, [gameLoop, gameSpeed, isRunning]);

  useEffect(() => {
    if (isGameOver) return;
    const goal = currentStage.goal;
    if (score >= goal) {
      if (stage < STAGES.length) {
        setStage(prev => prev + 1);
      } else if (!gameWon) {
        setGameWon(true); setIsGameOver(true); setIsRunning(false);
      }
    }
  }, [score, stage, isGameOver, gameWon, currentStage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <>
      <style>{`
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center font-mono text-white p-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border-t-4" style={{borderColor: snakeColor}}>
          <h1 className="text-4xl font-bold text-center tracking-wider mb-4" style={{color: snakeColor}}>SNAKE</h1>
          
          <div className="relative bg-gray-900 rounded-lg shadow-inner" style={{width: CANVAS_SIZE, height: CANVAS_SIZE}}>
            {/* Render Snake */}
            {snake.map((part, index) => {
                const isHead = index === 0;
                const isTail = index === snake.length - 1;
                
                let tailDirection = {x: 0, y: -1}; // Default
                if(isTail && snake.length > 1) {
                    const beforeTail = snake[snake.length - 2];
                    tailDirection = { x: part.x - beforeTail.x, y: part.y - beforeTail.y };
                }

                return (
                    <div key={index} className="absolute flex items-center justify-center"
                        style={{
                            width: GRID_SIZE, height: GRID_SIZE,
                            left: `${part.x * GRID_SIZE}px`,
                            top: `${part.y * GRID_SIZE}px`,
                            transition: `all ${gameSpeed}ms linear`,
                        }}>
                        {isHead ? <SnakeHead direction={direction} color={snakeColor} /> :
                         isTail && snake.length > 1 ? <SnakeTail color={snakeColor} tailDirection={tailDirection} /> :
                         <SnakeBody color={snakeColor} />}
                    </div>
                );
            })}

            {/* Render Food */}
            <div className="absolute" style={{ width: GRID_SIZE, height: GRID_SIZE, left: `${food.x * GRID_SIZE}px`, top: `${food.y * GRID_SIZE}px` }}>
                <Food color={foodColor} />
            </div>

            {(!isRunning && !isGameOver) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-center">
                      <p className="text-2xl">Press any arrow key to start</p>
                      <p className="text-lg mt-2">or use touch controls</p>
                  </div>
              </div>
            )}
            {isGameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg text-center">
                  {gameWon ? (
                      <>
                          <h2 className="text-5xl font-extrabold text-yellow-400">YOU WIN!</h2>
                          <p className="text-xl mt-2">You conquered all stages!</p>
                      </>
                  ) : (
                      <>
                          <h2 className="text-5xl font-extrabold text-red-500">GAME OVER</h2>
                          <p className="text-xl mt-2">Your Score: {score}</p>
                      </>
                  )}
                <button onClick={resetGame} className="mt-6 px-6 py-2 bg-green-500 text-gray-900 font-bold rounded-lg hover:bg-green-400 transition-colors duration-200">
                  RESTART
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center text-xl font-bold">
            <div> SCORE: <span className="text-yellow-400">{score}</span> </div>
            <div> STAGE: <span style={{color: snakeColor}}>{stage}</span> </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
              <div></div>
              <button onClick={() => handleTouchControl({x: 0, y: -1})} className="bg-gray-700 p-4 rounded-lg focus:outline-none focus:ring-2" style={{ringColor: snakeColor}}>▲</button>
              <div></div>
              <button onClick={() => handleTouchControl({x: -1, y: 0})} className="bg-gray-700 p-4 rounded-lg focus:outline-none focus:ring-2" style={{ringColor: snakeColor}}>◀</button>
              <button onClick={() => handleTouchControl({x: 0, y: 1})} className="bg-gray-700 p-4 rounded-lg focus:outline-none focus:ring-2" style={{ringColor: snakeColor}}>▼</button>
              <button onClick={() => handleTouchControl({x: 1, y: 0})} className="bg-gray-700 p-4 rounded-lg focus:outline-none focus:ring-2" style={{ringColor: snakeColor}}>▶</button>
          </div>
        </div>
      </div>
    </>
  );
}
