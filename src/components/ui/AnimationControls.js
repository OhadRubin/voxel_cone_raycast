import React from 'react';

const AnimationControls = ({
  showRays,
  onToggleRays,
  isAnimating,
  onToggleAnimation,
  rotationSpeed,
  onSpeedChange
}) => {
  return (
    <div className="absolute bottom-4 left-4 space-y-2">
      <button 
        onClick={onToggleRays}
        className="bg-blue-500 text-white px-4 py-2 rounded block hover:bg-blue-600 transition-colors"
      >
        {showRays ? 'Hide' : 'Show'} Rays
      </button>
      
      <button 
        onClick={onToggleAnimation}
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
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default AnimationControls;