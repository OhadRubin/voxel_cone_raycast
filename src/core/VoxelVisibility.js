
import { WorldProvider } from './WorldProvider.js';

export function calculateRayCountForDistance(distance, halfAngle, voxelSize) {
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

export class VoxelVisibility {
  constructor(config, worldProvider) {
    this.config = config;
    this.world = worldProvider;
  }
  

  
  // Trace a single ray and yield visible voxels
  *traceRayHelper(origin, direction, maxDistance) {
    // Get starting voxel
    let current = this.world.worldToVoxel(origin);
    
    // Step direction (1 or -1)
    const stepX = direction.x > 0 ? 1 : -1;
    const stepY = direction.y > 0 ? 1 : -1;
    const stepZ = direction.z > 0 ? 1 : -1;
    
    // Calculate t values for next voxel boundaries
    const voxelSize = this.config.voxelSize;
    const nextVoxelBoundaryX = (current.x + (stepX > 0 ? 1 : 0)) * voxelSize + this.config.robotPosition.x;
    const nextVoxelBoundaryY = (current.y + (stepY > 0 ? 1 : 0)) * voxelSize + this.config.robotPosition.y;
    const nextVoxelBoundaryZ = (current.z + (stepZ > 0 ? 1 : 0)) * voxelSize + this.config.robotPosition.z;
    
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
    while (this.world.isInBounds(current.x, current.y, current.z) && distance < maxDistance) {
      // Yield visible voxel
      yield { x: current.x, y: current.y, z: current.z };
      
      // Check if current voxel blocks further visibility
      if (this.world.isVoxelOpaque(current.x, current.y, current.z)) {
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
  }

  // Trace a single ray and collect visible voxels
  traceRay(origin, direction, maxDistance) {
    return Array.from(this.traceRayHelper(origin, direction, maxDistance));
  }
  
  *generateConeRays(cone, rayCount) {
    // Always yield center ray first
    yield {
      origin: cone.origin,
      direction: cone.direction
    };
    
    if (rayCount <= 1) return;
    
    // Calculate how many rays we've allocated so far
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
        
        yield {
          origin: cone.origin,
          direction: rayDir
        };
      }
      
      raysRemaining -= raysInRing;
      currentRadius += radialStep;
    }
  }
  
  *getVisibleVoxelsInConeHelper(cone, rayCount) {
    const visibleSet = new Set(); // Track visited voxels to avoid duplicates
    
    for (const ray of this.generateConeRays(cone, rayCount)) {
      for (const voxel of this.traceRayHelper(ray.origin, ray.direction, cone.maxRange)) {
        const key = `${voxel.x},${voxel.y},${voxel.z}`;
        if (!visibleSet.has(key)) {
          visibleSet.add(key);
          yield voxel;
        }
      }
    }
  }

  getVisibleVoxelsInCone(cone, rayCount) {
    return Array.from(this.getVisibleVoxelsInConeHelper(cone, rayCount));
  }
  
  setVoxelOpaque(x, y, z, opaque) {
    this.world.setVoxelOpaque(x, y, z, opaque);
  }
  
  
    

}