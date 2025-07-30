import { useRef, useEffect } from 'react';

const useAnimationLoop = (callback, isAnimating, speed = 1.0) => {
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    if (isAnimating && callback) {
      const animate = (currentTime) => {
        if (lastTimeRef.current !== null) {
          const deltaTime = (currentTime - lastTimeRef.current) / 1000;
          callback(deltaTime * speed);
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
  }, [isAnimating, callback, speed]);

  return animationRef.current;
};

export default useAnimationLoop;