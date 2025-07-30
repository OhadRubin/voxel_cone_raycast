
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


// export class ConeRayIterator {
//   constructor(cone, rayCount) {
    
//   }
// }

export class VoxelVisibility {
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
  
  // Trace a single ray and yield visible voxels
  *traceRayHelper(origin, direction, maxDistance) {
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
      // Yield visible voxel
      yield { x: current.x, y: current.y, z: current.z };
      
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
    if (this.isInBounds(x, y, z)) {
      this.voxelData[this.getIndex(x, y, z)] = opaque;
    }
  }
  
  
    

}