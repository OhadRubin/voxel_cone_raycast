import React from 'react';

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

export default StatsDisplay;