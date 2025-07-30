import { useState, useRef } from 'react';

const useFpsCounter = () => {
  const [fps, setFps] = useState(60);
  const fpsTimeRef = useRef(performance.now());
  const fpsCountRef = useRef(0);

  const updateFpsCounter = () => {
    fpsCountRef.current++;
    const now = performance.now();
    if (now - fpsTimeRef.current > 1000) {
      setFps(Math.round(fpsCountRef.current * 1000 / (now - fpsTimeRef.current)));
      fpsCountRef.current = 0;
      fpsTimeRef.current = now;
    }
  };

  return { fps, updateFpsCounter };
};

export default useFpsCounter;