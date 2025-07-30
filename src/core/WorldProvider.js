export class WorldProvider {
  constructor(config) {
    this.config = config;
    this.voxelData = new Array(config.gridSize ** 3).fill(false);
  }
  
  worldToVoxel(pos) {
    return {
      x: Math.floor(pos.x / this.config.voxelSize + this.config.gridSize / 2),
      y: Math.floor(pos.y / this.config.voxelSize),
      z: Math.floor(pos.z / this.config.voxelSize + this.config.gridSize / 2)
    };
  }
  
  voxelToWorld(x, y, z) {
    return {
      x: (x - this.config.gridSize / 2) * this.config.voxelSize + this.config.voxelSize / 2,
      y: y * this.config.voxelSize + this.config.voxelSize / 2,
      z: (z - this.config.gridSize / 2) * this.config.voxelSize + this.config.voxelSize / 2
    };
  }
  
  isInBounds(x, y, z) {
    return x >= 0 && x < this.config.gridSize &&
           y >= 0 && y < this.config.gridSize &&
           z >= 0 && z < this.config.gridSize;
  }
  
  getIndex(x, y, z) {
    return x + y * this.config.gridSize + z * this.config.gridSize * this.config.gridSize;
  }
  
  isVoxelOpaque(x, y, z) {
    if (!this.isInBounds(x, y, z)) return false;
    return this.voxelData[this.getIndex(x, y, z)];
  }
  
  setVoxelOpaque(x, y, z, opaque) {
    if (this.isInBounds(x, y, z)) {
      this.voxelData[this.getIndex(x, y, z)] = opaque;
    }
  }
}