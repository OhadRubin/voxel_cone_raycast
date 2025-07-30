import React from 'react';

const Controls = ({ cone, onConeChange, rayCount, voxelSize, gridSize }) => {
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
          max={gridSize} 
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

export default Controls;