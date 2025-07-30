export const rotateVectorY = (vector, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return {
    x: vector.x * cos - vector.z * sin,
    y: vector.y,
    z: vector.x * sin + vector.z * cos
  };
};

export const normalizeVector = (vector) => {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
};

export const dotProduct = (a, b) => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

export const crossProduct = (a, b) => {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
};

export const vectorDistance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const vectorAdd = (a, b) => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
};

export const vectorSubtract = (a, b) => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
};

export const vectorScale = (vector, scale) => {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    z: vector.z * scale
  };
};