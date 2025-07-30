import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import VoxelScene from './components/VoxelScene';
import Controls from './components/ui/Controls';
import StatsDisplay from './components/ui/StatsDisplay';
import AnimationControls from './components/ui/AnimationControls';

import { VoxelVisibility, calculateRayCountForDistance } from './core/VoxelVisibility';
import { WorldProvider } from './core/WorldProvider';
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
  const totalRotationRef = useRef(0);
  const voxelSize = 1;
  const gridSize = 100;
  
  const { fps, updateFpsCounter } = useFpsCounter();
  
  const rayCount = useMemo(() => {
    return calculateRayCountForDistance(
      cone.maxRange,
      cone.halfAngle,
      voxelSize
    );
  }, [cone.maxRange, cone.halfAngle, voxelSize]);
  
  // Function to regenerate pillars
  const regeneratePillars = useCallback(() => {
    if (!visibility.current) return;
    
    // Clear existing pillars (keep walls intact)
    // We need to clear the entire voxel data and rebuild everything
    // since we can't easily identify which voxels are pillars vs walls
    visibility.current.voxelData.fill(false);
    let obstacles = 0;
    
    // Rebuild walls (same as initial setup)
    const wallStart = Math.floor(gridSize * 0.2);
    const wallEnd = Math.floor(gridSize * 0.8);
    const wallHeight = Math.floor(gridSize * 0.2);
    const wallPosition = Math.floor(gridSize * 0.4);
    
    for (let x = wallStart; x < wallEnd; x++) {
      for (let y = 0; y < wallHeight; y++) {
        visibility.current.setVoxelOpaque(x, y, wallPosition, true);
        visibility.current.setVoxelOpaque(wallPosition, y, x, true);
        obstacles += 2;
      }
    }
    
    // Generate new pillars
    const pillarMinPos = Math.floor(gridSize * 0.1);
    const pillarMaxPos = Math.floor(gridSize * 0.88);
    const pillarHeight = Math.floor(gridSize * 0.3);
    const pillarCount = Math.max(3, Math.floor(gridSize / 10));
    
    for (let i = 0; i < pillarCount; i++) {
      const x = Math.floor(Math.random() * (pillarMaxPos - pillarMinPos)) + pillarMinPos;
      const z = Math.floor(Math.random() * (pillarMaxPos - pillarMinPos)) + pillarMinPos;
      for (let y = 0; y < pillarHeight; y++) {
        visibility.current.setVoxelOpaque(x, y, z, true);
        visibility.current.setVoxelOpaque(x + 1, y, z, true);
        visibility.current.setVoxelOpaque(x, y, z + 1, true);
        visibility.current.setVoxelOpaque(x + 1, y, z + 1, true);
        obstacles += 4;
      }
    }
    
    setObstacleCount(obstacles);
  }, [gridSize]);
  
  const rotateConeCallback = useCallback((deltaTime) => {
    const angle = rotationSpeed * deltaTime;
    totalRotationRef.current += angle;
    
    // Check if we've completed a full 360-degree rotation (2π radians)
    if (totalRotationRef.current >= 2 * Math.PI) {
      totalRotationRef.current -= 2 * Math.PI; // Reset counter
      regeneratePillars(); // Generate new pillars
    }
    
    const newDirection = rotateVectorY(cone.direction, angle);
    setCone(prev => ({ ...prev, direction: newDirection }));
  }, [cone.direction, rotationSpeed, regeneratePillars]);
  
  useAnimationLoop(rotateConeCallback, isAnimating, 1.0);
  
  // Initialize voxel world and obstacles (runs only once)
  useEffect(() => {
    const config = {
      voxelSize: voxelSize,
      gridSize: gridSize
    };
    const worldProvider = new WorldProvider(config);
    visibility.current = new VoxelVisibility(config, worldProvider);
    
    let obstacles = 0;
    
    // Create walls (scaled to grid size)
    const wallStart = Math.floor(gridSize * 0.2);  // 20% of grid
    const wallEnd = Math.floor(gridSize * 0.8);    // 80% of grid
    const wallHeight = Math.floor(gridSize * 0.2); // 20% of grid
    const wallPosition = Math.floor(gridSize * 0.4); // 40% of grid
    
    for (let x = wallStart; x < wallEnd; x++) {
      for (let y = 0; y < wallHeight; y++) {
        visibility.current.setVoxelOpaque(x, y, wallPosition, true);
        visibility.current.setVoxelOpaque(wallPosition, y, x, true);
        obstacles += 2;
      }
    }
    
    // Create pillars (2x2, scaled to grid size)
    const pillarMinPos = Math.floor(gridSize * 0.1);  // 10% of grid
    const pillarMaxPos = Math.floor(gridSize * 0.88); // 88% of grid (leave room for 2x2)
    const pillarHeight = Math.floor(gridSize * 0.3);  // 30% of grid
    const pillarCount = Math.max(3, Math.floor(gridSize / 10)); // Scale pillar count with grid size
    
    for (let i = 0; i < pillarCount; i++) {
      const x = Math.floor(Math.random() * (pillarMaxPos - pillarMinPos)) + pillarMinPos;
      const z = Math.floor(Math.random() * (pillarMaxPos - pillarMinPos)) + pillarMinPos;
      for (let y = 0; y < pillarHeight; y++) {
        visibility.current.setVoxelOpaque(x, y, z, true);
        visibility.current.setVoxelOpaque(x + 1, y, z, true);
        visibility.current.setVoxelOpaque(x, y, z + 1, true);
        visibility.current.setVoxelOpaque(x + 1, y, z + 1, true);
        obstacles += 4;
      }
    }
    
    setObstacleCount(obstacles);
  }, []); // Empty dependency array - runs only once
  
  // Update visibility when cone changes
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
          gridSize={gridSize}
        />
      </div>
      
      <Controls 
        cone={cone}
        onConeChange={setCone}
        rayCount={rayCount}
        voxelSize={voxelSize}
        gridSize={gridSize}
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