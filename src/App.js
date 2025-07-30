import { useState, useEffect, useRef, useCallback } from 'react';

import VoxelScene from './components/VoxelScene';
import Controls from './components/ui/Controls';
import StatsDisplay from './components/ui/StatsDisplay';
import AnimationControls from './components/ui/AnimationControls';

import { VoxelVisibility } from './core/VoxelVisibility';
import { rotateVectorY } from './utils/calculations';
import useAnimationLoop from './hooks/useAnimationLoop';
import useFpsCounter from './hooks/useFpsCounter';

const App = () => {
  const [cone, setCone] = useState({
    origin: { x: 0, y: 5, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
    halfAngle: Math.PI / 6,
    maxRange: 20
  });
  
  const [showRays, setShowRays] = useState(false);
  const [visibleVoxels, setVisibleVoxels] = useState([]);
  const [obstacleCount, setObstacleCount] = useState(0);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  
  const visibility = useRef(null);
  const voxelSize = 1;
  
  const { fps, updateFpsCounter } = useFpsCounter();
  
  const rayCount = VoxelVisibility.calculateRayCountForDistance(
    cone.maxRange,
    cone.halfAngle,
    voxelSize
  );
  
  const rotateConeCallback = useCallback((deltaTime) => {
    const angle = rotationSpeed * deltaTime;
    const newDirection = rotateVectorY(cone.direction, angle);
    setCone(prev => ({ ...prev, direction: newDirection }));
  }, [cone.direction, rotationSpeed]);
  
  useAnimationLoop(rotateConeCallback, isAnimating, 1.0);
  
  useEffect(() => {
    visibility.current = new VoxelVisibility({
      voxelSize: voxelSize,
      gridSize: 50
    });
    
    let obstacles = 0;
    
    for (let x = 10; x < 40; x++) {
      for (let y = 0; y < 10; y++) {
        visibility.current.setVoxelOpaque(x, y, 20, true);
        visibility.current.setVoxelOpaque(20, y, x, true);
        obstacles += 2;
      }
    }
    
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 40) + 5;
      const z = Math.floor(Math.random() * 40) + 5;
      for (let y = 0; y < 15; y++) {
        visibility.current.setVoxelOpaque(x, y, z, true);
        obstacles++;
      }
    }
    
    setObstacleCount(obstacles);
    
    const visible = visibility.current.getVisibleVoxelsInCone(cone, rayCount);
    setVisibleVoxels(visible);
  }, [cone, rayCount]);
  
  useEffect(() => {
    if (visibility.current) {
      const visible = visibility.current.getVisibleVoxelsInCone(cone, rayCount);
      setVisibleVoxels(visible);
      updateFpsCounter();
    }
  }, [cone, rayCount, updateFpsCounter]);
  
  return (
    <div className="w-full h-screen relative bg-gray-100">
      <div className="absolute inset-0">
        <VoxelScene 
          visibility={visibility.current}
          cone={cone}
          showRays={showRays}
          visibleVoxels={visibleVoxels}
        />
      </div>
      
      <Controls 
        cone={cone}
        onConeChange={setCone}
        rayCount={rayCount}
        voxelSize={voxelSize}
      />
      
      <StatsDisplay 
        visibleCount={visibleVoxels.length}
        totalVoxels={obstacleCount}
        fps={fps}
      />
      
      <AnimationControls
        showRays={showRays}
        onToggleRays={() => setShowRays(!showRays)}
        isAnimating={isAnimating}
        onToggleAnimation={() => setIsAnimating(!isAnimating)}
        rotationSpeed={rotationSpeed}
        onSpeedChange={setRotationSpeed}
      />
      
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        Click and drag to rotate camera, scroll to zoom
      </div>
    </div>
  );
};

export default App;