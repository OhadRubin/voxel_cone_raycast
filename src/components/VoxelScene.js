import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VoxelVisibility } from '../core/VoxelVisibility';

const VoxelScene = ({ visibility, cone, showRays, visibleVoxels, gridSize }) => {
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
    
    // Clear any existing canvas elements (React StrictMode cleanup)
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
    sceneRef.current = scene;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -gridSize;
    directionalLight.shadow.camera.right = gridSize;
    directionalLight.shadow.camera.top = gridSize;
    directionalLight.shadow.camera.bottom = -gridSize;
    scene.add(directionalLight);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x999999, 0xcccccc);
    scene.add(gridHelper);
    
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
    
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    
    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      const currentMount = mountRef.current;
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [gridSize]);
  
  useEffect(() => {
    if (!sceneRef.current || !visibility) return;
    
    const scene = sceneRef.current;
    const visibleSet = new Set(visibleVoxels.map(v => `${v.x},${v.y},${v.z}`));
    
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
    
    for (let x = 0; x < visibility.config.gridSize; x++) {
      for (let y = 0; y < visibility.config.gridSize; y++) {
        for (let z = 0; z < visibility.config.gridSize; z++) {
          const key = `${x},${y},${z}`;
          const isOpaque = visibility.world.isVoxelOpaque(x, y, z);
          const isVisible = visibleSet.has(key);
          
          let mesh = voxelMeshesRef.current.get(key);
          
          if (!mesh && !isOpaque && !isVisible) continue;
          
          if (!mesh) {
            mesh = new THREE.Mesh(geometry);
            const worldPos = visibility.world.voxelToWorld(x, y, z);
            mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            voxelMeshesRef.current.set(key, mesh);
          }
          
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
  
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    if (coneMeshRef.current) {
      scene.remove(coneMeshRef.current);
      coneMeshRef.current.geometry.dispose();
      coneMeshRef.current.material.dispose();
    }
    
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
    
    coneMesh.position.set(cone.origin.x, cone.origin.y, cone.origin.z);
    
    const defaultDir = new THREE.Vector3(0, -1, 0);
    const targetDir = new THREE.Vector3(cone.direction.x, cone.direction.y, cone.direction.z);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, targetDir.normalize());
    coneMesh.setRotationFromQuaternion(quaternion);
    
    coneMesh.translateY(-cone.maxRange / 2);
    
    scene.add(coneMesh);
    coneMeshRef.current = coneMesh;
  }, [cone]);
  
  useEffect(() => {
    if (!sceneRef.current || !visibility) return;
    
    const scene = sceneRef.current;
    
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

export default VoxelScene;