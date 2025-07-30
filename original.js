how would you restructure this code if you had to refactor it? what file structure would you use? don't do it, just explain.
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Utility functions
const rotateVectorY = (vector, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.z * sin,
    y: vector.y,
    z: vector.x * sin + vector.z * cos
  };
};

// Core visibility logic
class VoxelVisibility {
  constructor(config) {
    this.config = config;
    this.voxelData = new Array(config.gridSize ** 3).fill(false);
  }
  
  // Convert world position to voxel coordinates
  worldToVoxel(pos) {
    return {
      x: Math.floor(pos.x / this.config.voxelSize + this.config.gridSize / 2),
      y: Math.floor(pos.y / this.config.voxelSize),
      z: Math.floor(pos.z / this.config.voxelSize + this.config.gridSize / 2)
    };
  }
  
  // Convert voxel coordinates to world position (center of voxel)
  voxelToWorld(x, y, z) {
    return {
      x: (x - this.config.gridSize / 2) * this.config.voxelSize + this.config.voxelSize / 2,
      y: y * this.config.voxelSize + this.config.voxelSize / 2,
      z: (z - this.config.gridSize / 2) * this.config.voxelSize + this.config.voxelSize / 2
    };
  }
  
  // Check if voxel coordinates are in bounds
  isInBounds(x, y, z) {
    return x >= 0 && x < this.config.gridSize &&
           y >= 0 && y < this.config.gridSize &&
           z >= 0 && z < this.config.gridSize;
  }
  
  // Get array index from voxel coordinates
  getIndex(x, y, z) {
    return x + y * this.config.gridSize + z * this.config.gridSize * this.config.gridSize;
  }
  
  // Amanatides & Woo voxel traversal algorithm
  hasLineOfSight(from, to) {
    const direction = {
      x: to.x - from.x,
      y: to.y - from.y,
      z: to.z - from.z
    };
    
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (length === 0) return true;
    
    // Normalize direction
    direction.x /= length;
    direction.y /= length;
    direction.z /= length;
    
    // Get starting voxel
    let current = this.worldToVoxel(from);
    const target = this.worldToVoxel(to);
    
    // Step direction (1 or -1)
    const stepX = direction.x > 0 ? 1 : -1;
    const stepY = direction.y > 0 ? 1 : -1;
    const stepZ = direction.z > 0 ? 1 : -1;
    
    // Calculate t values for next voxel boundaries
    const voxelSize = this.config.voxelSize;
    const nextVoxelBoundaryX = (current.x + (stepX > 0 ? 1 : 0)) * voxelSize - this.config.gridSize * voxelSize / 2;
    const nextVoxelBoundaryY = (current.y + (stepY > 0 ? 1 : 0)) * voxelSize;
    const nextVoxelBoundaryZ = (current.z + (stepZ > 0 ? 1 : 0)) * voxelSize - this.config.gridSize * voxelSize / 2;
    
    // Calculate t values
    let tMaxX = direction.x !== 0 ? (nextVoxelBoundaryX - from.x) / direction.x : Infinity;
    let tMaxY = direction.y !== 0 ? (nextVoxelBoundaryY - from.y) / direction.y : Infinity;
    let tMaxZ = direction.z !== 0 ? (nextVoxelBoundaryZ - from.z) / direction.z : Infinity;
    
    // Calculate delta t for each axis
    const tDeltaX = direction.x !== 0 ? voxelSize / Math.abs(direction.x) : Infinity;
    const tDeltaY = direction.y !== 0 ? voxelSize / Math.abs(direction.y) : Infinity;
    const tDeltaZ = direction.z !== 0 ? voxelSize / Math.abs(direction.z) : Infinity;
    
    // Traverse voxels
    while (this.isInBounds(current.x, current.y, current.z)) {
      // Check if current voxel blocks line of sight
      if (this.voxelData[this.getIndex(current.x, current.y, current.z)]) {
        return false; // Hit an opaque voxel
      }
      
      // Check if we've reached the target
      if (current.x === target.x && current.y === target.y && current.z === target.z) {
        return true;
      }
      
      // Move to next voxel
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        current.x += stepX;
        tMaxX += tDeltaX;
      } else if (tMaxY < tMaxZ) {
        current.y += stepY;
        tMaxY += tDeltaY;
      } else {
        current.z += stepZ;
        tMaxZ += tDeltaZ;
      }
      
      // Check if we've gone past the target
      if (tMaxX > length && tMaxY > length && tMaxZ > length) {
        break;
      }
    }
    
    return true;
  }
  
  // Trace a single ray and collect visible voxels
  traceRay(origin, direction, maxDistance) {
    const visibleVoxels = [];
    
    // Get starting voxel
    let current = this.worldToVoxel(origin);
    
    // Step direction (1 or -1)
    const stepX = direction.x > 0 ? 1 : -1;
    const stepY = direction.y > 0 ? 1 : -1;
    const stepZ = direction.z > 0 ? 1 : -1;
    
    // Calculate t values for next voxel boundaries
    const voxelSize = this.config.voxelSize;
    const nextVoxelBoundaryX = (current.x + (stepX > 0 ? 1 : 0)) * voxelSize - this.config.gridSize * voxelSize / 2;
    const nextVoxelBoundaryY = (current.y + (stepY > 0 ? 1 : 0)) * voxelSize;
    const nextVoxelBoundaryZ = (current.z + (stepZ > 0 ? 1 : 0)) * voxelSize - this.config.gridSize * voxelSize / 2;
    
    // Calculate t values
    let tMaxX = direction.x !== 0 ? (nextVoxelBoundaryX - origin.x) / direction.x : Infinity;
    let tMaxY = direction.y !== 0 ? (nextVoxelBoundaryY - origin.y) / direction.y : Infinity;
    let tMaxZ = direction.z !== 0 ? (nextVoxelBoundaryZ - origin.z) / direction.z : Infinity;
    
    // Calculate delta t for each axis
    const tDeltaX = direction.x !== 0 ? voxelSize / Math.abs(direction.x) : Infinity;
    const tDeltaY = direction.y !== 0 ? voxelSize / Math.abs(direction.y) : Infinity;
    const tDeltaZ = direction.z !== 0 ? voxelSize / Math.abs(direction.z) : Infinity;
    
    let distance = 0;
    
    // Traverse voxels
    while (this.isInBounds(current.x, current.y, current.z) && distance < maxDistance) {
      // Add visible voxel
      visibleVoxels.push({ x: current.x, y: current.y, z: current.z });
      
      // Check if current voxel blocks further visibility
      if (this.voxelData[this.getIndex(current.x, current.y, current.z)]) {
        break; // Hit an opaque voxel, stop tracing
      }
      
      // Move to next voxel
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        current.x += stepX;
        distance = tMaxX * voxelSize;
        tMaxX += tDeltaX;
      } else if (tMaxY < tMaxZ) {
        current.y += stepY;
        distance = tMaxY * voxelSize;
        tMaxY += tDeltaY;
      } else {
        current.z += stepZ;
        distance = tMaxZ * voxelSize;
        tMaxZ += tDeltaZ;
      }
    }
    
    return visibleVoxels;
  }
  
  generateConeRays(cone, rayCount) {
    const rays = [];
    
    // Always add center ray
    rays.push({
      origin: cone.origin,
      direction: cone.direction
    });
    
    if (rayCount <= 1) return rays;
    
    // Calculate how many rays we've allocated so far
    let raysUsed = 1;
    let raysRemaining = rayCount - 1;
    
    // Create orthonormal basis for the cone
    // Find two perpendicular vectors to the cone direction
    let up = { x: 0, y: 1, z: 0 };
    if (Math.abs(cone.direction.y) > 0.9) {
      up = { x: 1, y: 0, z: 0 };
    }
    
    // Cross product to get first perpendicular vector
    const right = {
      x: cone.direction.y * up.z - cone.direction.z * up.y,
      y: cone.direction.z * up.x - cone.direction.x * up.z,
      z: cone.direction.x * up.y - cone.direction.y * up.x
    };
    
    // Normalize right
    const rightLength = Math.sqrt(right.x ** 2 + right.y ** 2 + right.z ** 2);
    right.x /= rightLength;
    right.y /= rightLength;
    right.z /= rightLength;
    
    // Cross product to get second perpendicular vector
    const forward = {
      x: cone.direction.y * right.z - cone.direction.z * right.y,
      y: cone.direction.z * right.x - cone.direction.x * right.z,
      z: cone.direction.x * right.y - cone.direction.y * right.x
    };
    
    // Generate concentric rings of rays
    const maxRadius = cone.maxRange * Math.tan(cone.halfAngle);
    const radialStep = this.config.voxelSize;
    let currentRadius = radialStep;
    
    while (currentRadius <= maxRadius && raysRemaining > 0) {
      // Calculate angle for this ring based on radius
      const ringAngle = Math.atan(currentRadius / cone.maxRange);
      
      // Calculate rays needed for this ring
      const circumference = 2 * Math.PI * currentRadius;
      const raysInRing = Math.min(
        raysRemaining, 
        Math.max(1, Math.ceil(circumference / this.config.voxelSize))
      );
      
      // Generate rays around the ring
      for (let i = 0; i < raysInRing; i++) {
        const angle = (2 * Math.PI * i) / raysInRing;
        
        // Calculate direction for this ray
        const ringDir = {
          x: right.x * Math.cos(angle) + forward.x * Math.sin(angle),
          y: right.y * Math.cos(angle) + forward.y * Math.sin(angle),
          z: right.z * Math.cos(angle) + forward.z * Math.sin(angle)
        };
        
        // Combine with cone direction
        const rayDir = {
          x: cone.direction.x * Math.cos(ringAngle) + ringDir.x * Math.sin(ringAngle),
          y: cone.direction.y * Math.cos(ringAngle) + ringDir.y * Math.sin(ringAngle),
          z: cone.direction.z * Math.cos(ringAngle) + ringDir.z * Math.sin(ringAngle)
        };
        
        rays.push({
          origin: cone.origin,
          direction: rayDir
        });
      }
      
      raysRemaining -= raysInRing;
      currentRadius += radialStep;
    }
    
    return rays;
  }
  
  getVisibleVoxelsInCone(cone, rayCount) {
    const rays = this.generateConeRays(cone, rayCount);
    const visibleSet = new Map(); // Use map to avoid duplicates
    
    for (const ray of rays) {
      const voxels = this.traceRay(ray.origin, ray.direction, cone.maxRange);
      for (const voxel of voxels) {
        const key = `${voxel.x},${voxel.y},${voxel.z}`;
        visibleSet.set(key, voxel);
      }
    }
    
    return Array.from(visibleSet.values());
  }
  
  setVoxelOpaque(x, y, z, opaque) {
    if (this.isInBounds(x, y, z)) {
      this.voxelData[this.getIndex(x, y, z)] = opaque;
    }
  }
  
  static calculateRayCountForDistance(distance, halfAngle, voxelSize) {
    const maxRadius = distance * Math.tan(halfAngle);
    
    if (maxRadius < voxelSize / 2) return 1;
    
    let totalRays = 1; // Center ray
    let currentRadius = 0;
    const radialStep = voxelSize;
    
    while (currentRadius < maxRadius) {
      currentRadius += radialStep;
      if (currentRadius > maxRadius) currentRadius = maxRadius;
      
      const circumference = 2 * Math.PI * currentRadius;
      const raysInRing = Math.max(1, Math.ceil(circumference / voxelSize));
      totalRays += raysInRing;
    }
    
    return totalRays;
  }
}

// Three.js Scene Component
const VoxelScene = ({ visibility, cone, showRays, visibleVoxels }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const voxelMeshesRef = useRef(new Map());
  const coneMeshRef = useRef(null);
  const rayLinesRef = useRef([]);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
    sceneRef.current = scene;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x999999, 0xcccccc);
    scene.add(gridHelper);
    
    // Mouse controls
    let mouseX = 0, mouseY = 0;
    let isMouseDown = false;
    
    const handleMouseMove = (e) => {
      if (isMouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        camera.position.x = camera.position.x * Math.cos(deltaX * 0.01) - camera.position.z * Math.sin(deltaX * 0.01);
        camera.position.z = camera.position.x * Math.sin(deltaX * 0.01) + camera.position.z * Math.cos(deltaX * 0.01);
        camera.position.y += deltaY * 0.1;
        camera.position.y = Math.max(5, Math.min(100, camera.position.y));
        
        camera.lookAt(0, 0, 0);
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };
    const handleWheel = (e) => {
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      camera.lookAt(0, 0, 0);
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);
    
    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);
  
  // Update voxel visualization
  useEffect(() => {
    if (!sceneRef.current || !visibility) return;
    
    const scene = sceneRef.current;
    const visibleSet = new Set(visibleVoxels.map(v => `${v.x},${v.y},${v.z}`));
    
    // Create voxel geometry and materials
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const visibleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4CAF50,
      emissive: 0x2E7D32,
      emissiveIntensity: 0.2
    });
    const opaqueMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xF44336,
      emissive: 0xC62828,
      emissiveIntensity: 0.1
    });
    const hiddenMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x999999,
      opacity: 0,
      transparent: true
    });
    
    // Update existing voxels and create new ones
    for (let x = 0; x < visibility.config.gridSize; x++) {
      for (let y = 0; y < visibility.config.gridSize; y++) {
        for (let z = 0; z < visibility.config.gridSize; z++) {
          const key = `${x},${y},${z}`;
          const isOpaque = visibility.voxelData[visibility.getIndex(x, y, z)];
          const isVisible = visibleSet.has(key);
          
          let mesh = voxelMeshesRef.current.get(key);
          
          // Skip if no mesh exists and voxel is neither opaque nor visible
          if (!mesh && !isOpaque && !isVisible) continue;
          
          if (!mesh) {
            mesh = new THREE.Mesh(geometry);
            const worldPos = visibility.voxelToWorld(x, y, z);
            mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            voxelMeshesRef.current.set(key, mesh);
          }
          
          // Update material based on state
          if (isOpaque) {
            mesh.material = opaqueMaterial;
          } else if (isVisible) {
            mesh.material = visibleMaterial;
          } else {
            mesh.material = hiddenMaterial;
          }
        }
      }
    }
  }, [visibility, visibleVoxels]);
  
  // Update cone visualization
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Remove old cone
    if (coneMeshRef.current) {
      scene.remove(coneMeshRef.current);
      coneMeshRef.current.geometry.dispose();
      coneMeshRef.current.material.dispose();
    }
    
    // Create new cone
    const coneGeometry = new THREE.ConeGeometry(
      cone.maxRange * Math.tan(cone.halfAngle),
      cone.maxRange,
      32,
      1,
      true
    );
    
    const coneMaterial = new THREE.MeshPhongMaterial({
      color: 0x2196F3,
      opacity: 0.2,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
    
    // Position and orient the cone
    coneMesh.position.set(cone.origin.x, cone.origin.y, cone.origin.z);
    
    // Calculate rotation from default (0, -1, 0) to cone direction
    const defaultDir = new THREE.Vector3(0, -1, 0);
    const targetDir = new THREE.Vector3(cone.direction.x, cone.direction.y, cone.direction.z);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, targetDir.normalize());
    coneMesh.setRotationFromQuaternion(quaternion);
    
    // Offset cone so apex is at origin
    coneMesh.translateY(-cone.maxRange / 2);
    
    scene.add(coneMesh);
    coneMeshRef.current = coneMesh;
  }, [cone]);
  
  // Update ray visualization
  useEffect(() => {
    if (!sceneRef.current || !visibility) return;
    
    const scene = sceneRef.current;
    
    // Remove old rays
    rayLinesRef.current.forEach(line => {
      scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    rayLinesRef.current = [];
    
    if (showRays) {
      const rayCount = VoxelVisibility.calculateRayCountForDistance(
        cone.maxRange,
        cone.halfAngle,
        visibility.config.voxelSize
      );
      
      const rays = visibility.generateConeRays(cone, rayCount);
      
      rays.forEach(ray => {
        const points = [
          new THREE.Vector3(ray.origin.x, ray.origin.y, ray.origin.z),
          new THREE.Vector3(
            ray.origin.x + ray.direction.x * cone.maxRange,
            ray.origin.y + ray.direction.y * cone.maxRange,
            ray.origin.z + ray.direction.z * cone.maxRange
          )
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0xFF9800,
          opacity: 0.5,
          transparent: true
        });
        const line = new THREE.Line(geometry, material);
        
        scene.add(line);
        rayLinesRef.current.push(line);
      });
    }
  }, [showRays, cone, visibility]);
  
  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

// UI Controls Component
const Controls = ({ cone, onConeChange, rayCount, voxelSize }) => {
  const handleAngleChange = (e) => {
    const newAngle = parseFloat(e.target.value) * Math.PI / 180;
    onConeChange({ ...cone, halfAngle: newAngle });
  };
  
  const handleRangeChange = (e) => {
    const newRange = parseFloat(e.target.value);
    onConeChange({ ...cone, maxRange: newRange });
  };
  
  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Cone Controls</h3>
      
      <div className="mb-2">
        <label className="block text-sm">Angle: {(cone.halfAngle * 180 / Math.PI).toFixed(0)}°</label>
        <input 
          type="range" 
          min="10" 
          max="90" 
          value={cone.halfAngle * 180 / Math.PI}
          onChange={handleAngleChange}
          className="w-full"
        />
      </div>
      
      <div className="mb-2">
        <label className="block text-sm">Range: {cone.maxRange} voxels</label>
        <input 
          type="range" 
          min="5" 
          max="50" 
          value={cone.maxRange}
          onChange={handleRangeChange}
          className="w-full"
        />
      </div>
      
      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
        <div>Auto-calculated ray count: <span className="font-bold text-gray-800">{rayCount}</span></div>
        <div>Ensures full coverage at max range</div>
        <div className="mt-1 text-xs">
          Coverage area: {(Math.PI * Math.pow(cone.maxRange * Math.tan(cone.halfAngle), 2)).toFixed(1)} voxels²
        </div>
      </div>
    </div>
  );
};

// Stats Display Component
const StatsDisplay = ({ visibleCount, totalVoxels, fps }) => {
  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Stats</h3>
      <div>Visible: {visibleCount}</div>
      <div>Obstacles: {totalVoxels}</div>
      <div>FPS: {fps}</div>
    </div>
  );
};

// Main App Component
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
  const [fps, setFps] = useState(60);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);
  const fpsTimeRef = useRef(performance.now());
  const fpsCountRef = useRef(0);
  
  const visibility = useRef(null);
  const voxelSize = 1;
  
  // Auto-calculate ray count based on cone parameters
  const rayCount = VoxelVisibility.calculateRayCountForDistance(
    cone.maxRange,
    cone.halfAngle,
    voxelSize
  );
  
  useEffect(() => {
    // Initialize visibility system
    visibility.current = new VoxelVisibility({
      voxelSize: voxelSize,
      gridSize: 50
    });
    
    // Setup some test obstacles
    let obstacles = 0;
    
    // Create walls
    for (let x = 10; x < 40; x++) {
      for (let y = 0; y < 10; y++) {
        visibility.current.setVoxelOpaque(x, y, 20, true);
        visibility.current.setVoxelOpaque(20, y, x, true);
        obstacles += 2;
      }
    }
    
    // Create pillars
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 40) + 5;
      const z = Math.floor(Math.random() * 40) + 5;
      for (let y = 0; y < 15; y++) {
        visibility.current.setVoxelOpaque(x, y, z, true);
        obstacles++;
      }
    }
    
    setObstacleCount(obstacles);
    
    // Run initial visibility calculation
    const visible = visibility.current.getVisibleVoxelsInCone(cone, rayCount);
    setVisibleVoxels(visible);
  }, []);
  
  useEffect(() => {
    // Update visibility when cone changes
    if (visibility.current) {
      const visible = visibility.current.getVisibleVoxelsInCone(cone, rayCount);
      setVisibleVoxels(visible);
      
      // Update FPS counter
      fpsCountRef.current++;
      const now = performance.now();
      if (now - fpsTimeRef.current > 1000) {
        setFps(Math.round(fpsCountRef.current * 1000 / (now - fpsTimeRef.current)));
        fpsCountRef.current = 0;
        fpsTimeRef.current = now;
      }
    }
  }, [cone, rayCount]);
  
  // Animation loop
  useEffect(() => {
    if (isAnimating) {
      const animate = (currentTime) => {
        if (lastTimeRef.current !== null) {
          const deltaTime = (currentTime - lastTimeRef.current) / 1000;
          
          // Rotate the cone direction
          const angle = rotationSpeed * deltaTime;
          const newDirection = rotateVectorY(cone.direction, angle);
          setCone(prev => ({ ...prev, direction: newDirection }));
        }
        
        lastTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        lastTimeRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, rotationSpeed, cone.direction]);
  
  return (
    <div className="w-full h-screen relative bg-gray-100">
      <VoxelScene 
        visibility={visibility.current}
        cone={cone}
        showRays={showRays}
        visibleVoxels={visibleVoxels}
      />
      
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
      
      {/* Animation Controls */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <button 
          onClick={() => setShowRays(!showRays)}
          className="bg-blue-500 text-white px-4 py-2 rounded block hover:bg-blue-600 transition-colors"
        >
          {showRays ? 'Hide' : 'Show'} Rays
        </button>
        
        <button 
          onClick={() => setIsAnimating(!isAnimating)}
          className={`px-4 py-2 rounded block transition-colors ${
            isAnimating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isAnimating ? 'Stop' : 'Start'} Rotation
        </button>
        
        {isAnimating && (
          <div className="bg-white p-2 rounded">
            <label className="block text-sm">Speed: {rotationSpeed.toFixed(1)} rad/s</label>
            <input 
              type="range" 
              min="0.1" 
              max="3.0" 
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        Click and drag to rotate camera, scroll to zoom
      </div>
    </div>
  );
};

export default App;