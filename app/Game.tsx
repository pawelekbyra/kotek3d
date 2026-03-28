'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, ContactShadows, Environment, useGLTF, useAnimations, Float, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

// --- Level Components ---

function Meadow() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#4d8c3f" roughness={0.8} />
    </mesh>
  );
}

function StylizedTree({ position, scale = 1 }: any) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#388e3c" />
      </mesh>
    </group>
  );
}

function Flowers({ data }: { data: { id: number, position: [number, number, number] }[] }) {
  const { scene } = useGLTF('/Flower.glb') as any;

  // Extract the geometry and material from the GLTF
  // Usually flowers are simple groups, we try to find the first mesh
  const flowerMesh = useMemo(() => {
    let mesh: any = null;
    scene.traverse((obj: any) => {
      if (obj.isMesh && !mesh) mesh = obj;
    });
    return mesh;
  }, [scene]);

  if (!flowerMesh) return null;

  return (
    <Instances range={data.length} geometry={flowerMesh.geometry} material={flowerMesh.material}>
      {data.map((f) => (
        <Instance key={f.id} position={f.position} scale={0.5} />
      ))}
    </Instances>
  );
}

function Bird({ url, position, speed = 1, radius = 5, height = 2 }: any) {
  const { scene, animations } = useGLTF(url) as any;
  const { actions } = useAnimations(animations, scene);
  const ref = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (actions && actions[Object.keys(actions)[0]]) {
      actions[Object.keys(actions)[0]]?.play();
    }
  }, [actions]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.x = position[0] + Math.cos(t) * radius;
    ref.current.position.z = position[2] + Math.sin(t) * radius;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * height;
    ref.current.rotation.y = -t + Math.PI / 2;
  });

  return (
    <group ref={ref} scale={0.01}>
      <primitive object={scene} />
    </group>
  );
}

function Collectible({ position, isCollected }: any) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 2;
    }
  });

  if (isCollected) return null;

  return (
    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
      <mesh position={position} ref={ref}>
        <torusKnotGeometry args={[0.3, 0.1, 64, 8]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} emissive="orange" emissiveIntensity={0.5} />
      </mesh>
    </Float>
  );
}

// --- Player & Game Logic ---

function Player({ onCollect, onReset, platforms, collectibles }: any) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('/RobotExpressive.glb');
  const { actions } = useAnimations(animations, group);

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    dance: false,
    wave: false,
  });

  const movementRef = useRef(movement);
  useEffect(() => {
    movementRef.current = movement;
  }, [movement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': setMovement((m) => ({ ...m, forward: true })); break;
        case 's': case 'arrowdown': setMovement((m) => ({ ...m, backward: true })); break;
        case 'a': case 'arrowleft': setMovement((m) => ({ ...m, left: true })); break;
        case 'd': case 'arrowright': setMovement((m) => ({ ...m, right: true })); break;
        case 'shift': setMovement((m) => ({ ...m, run: true })); break;
        case ' ': setMovement((m) => ({ ...m, jump: true })); break;
        case 'e': setMovement((m) => ({ ...m, dance: true })); break;
        case 'r': setMovement((m) => ({ ...m, wave: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': setMovement((m) => ({ ...m, forward: false })); break;
        case 's': case 'arrowdown': setMovement((m) => ({ ...m, backward: false })); break;
        case 'a': case 'arrowleft': setMovement((m) => ({ ...m, left: false })); break;
        case 'd': case 'arrowright': setMovement((m) => ({ ...m, right: false })); break;
        case 'shift': setMovement((m) => ({ ...m, run: false })); break;
        case ' ': setMovement((m) => ({ ...m, jump: false })); break;
        case 'e': setMovement((m) => ({ ...m, dance: false })); break;
        case 'r': setMovement((m) => ({ ...m, wave: false })); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const [currentAction, setCurrentAction] = useState('Idle');
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const isGrounded = useRef(true);

  useEffect(() => {
    if (!actions) return;
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;

    let action = 'Idle';
    if (!isGrounded.current) {
        action = 'Jump';
    } else if (movement.dance) {
        action = 'Dance';
    } else if (movement.wave) {
        action = 'Wave';
    } else if (isMoving) {
        action = movement.run ? 'Running' : 'Walking';
    }

    if (currentAction !== action) {
      const nextAction = actions[action];
      const prevAction = actions[currentAction];

      if (prevAction) prevAction.fadeOut(0.2);
      if (nextAction) {
        nextAction.reset().fadeIn(0.2).play();
        if (action === 'Jump' || action === 'Dance' || action === 'Wave') {
            nextAction.setLoop(THREE.LoopOnce, 1);
            nextAction.clampWhenFinished = true;
        } else {
            nextAction.setLoop(THREE.LoopRepeat, Infinity);
        }
      }
      setCurrentAction(action);
    }
  }, [movement, actions, currentAction]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const baseSpeed = movementRef.current.run ? 10 : 5;
    const rotateSpeed = 3 * delta;

    // Movement
    if (movementRef.current.left) group.current.rotation.y += rotateSpeed;
    if (movementRef.current.right) group.current.rotation.y -= rotateSpeed;

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (movementRef.current.forward) moveDirection.z += 1;
    if (movementRef.current.backward) moveDirection.z -= 1;
    moveDirection.applyQuaternion(group.current.quaternion);
    moveDirection.normalize().multiplyScalar(baseSpeed);

    group.current.position.x += moveDirection.x * delta;
    group.current.position.z += moveDirection.z * delta;

    // Gravity & Jump - Buffed jump for better navigation
    if (movementRef.current.jump && isGrounded.current) {
      velocity.current.y = 12; // Increased from 10
      isGrounded.current = false;
    }

    velocity.current.y -= 30 * delta;
    group.current.position.y += velocity.current.y * delta;

    // Ground collision
    if (group.current.position.y <= 0) {
      group.current.position.y = 0;
      velocity.current.y = 0;
      isGrounded.current = true;
    }

    // Proximity Collectibles
    collectibles.forEach((c: any) => {
      if (!c.collected) {
        const dist = group.current.position.distanceTo(new THREE.Vector3(...c.position));
        if (dist < 1.5) {
          onCollect(c.id);
        }
      }
    });

    // Boundaries (keep player in the meadow)
    if (Math.abs(group.current.position.x) > 250) group.current.position.x = Math.sign(group.current.position.x) * 250;
    if (Math.abs(group.current.position.z) > 250) group.current.position.z = Math.sign(group.current.position.z) * 250;

    const relativeCameraOffset = new THREE.Vector3(0, 5, -10);
    const cameraOffset = relativeCameraOffset.applyMatrix4(group.current.matrixWorld);
    state.camera.position.lerp(cameraOffset, 0.1);
    state.camera.lookAt(group.current.position.x, group.current.position.y + 2, group.current.position.z);
  });

  return (
    <group ref={group} dispose={null} scale={0.5} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// --- Main Game ---

export default function Game() {
  const [score, setScore] = useState(0);

  // Deterministic random positions for trees and flowers
  const envObjects = useMemo(() => {
    const trees = [];
    const flowers = [];
    for (let i = 0; i < 150; i++) {
        trees.push({
            id: i,
            position: [(Math.random() - 0.5) * 450, 0, (Math.random() - 0.5) * 450] as [number, number, number],
            scale: 0.8 + Math.random() * 0.5
        });
    }
    for (let i = 0; i < 500; i++) {
        flowers.push({
            id: i,
            position: [(Math.random() - 0.5) * 450, 0, (Math.random() - 0.5) * 450] as [number, number, number]
        });
    }
    return { trees, flowers };
  }, []);

  const [collectibleStates, setCollectibleStates] = useState(() => {
    const items = [];
    for (let i = 0; i < 20; i++) {
        items.push({
            id: i,
            position: [(Math.random() - 0.5) * 400, 1, (Math.random() - 0.5) * 400] as [number, number, number],
            collected: false
        });
    }
    return items;
  });

  const handleCollect = (id: number) => {
    setCollectibleStates(prev => prev.map(c => c.id === id ? { ...c, collected: true } : c));
    setScore(s => s + 100);
  };

  return (
    <div className="w-screen h-screen bg-[#87CEEB] relative">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 40, 100]} turbidity={0.1} rayleigh={0.5} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />

          <Meadow />

          {envObjects.trees.map(t => (
            <StylizedTree key={`tree-${t.id}`} position={t.position} scale={t.scale} />
          ))}

          <Flowers data={envObjects.flowers} />

          <Bird url="/Flamingo.glb" position={[20, 10, 0]} speed={0.4} radius={30} height={10} />
          <Bird url="/Parrot.glb" position={[-30, 15, 20]} speed={0.6} radius={25} height={8} />
          <Bird url="/Stork.glb" position={[10, 20, -30]} speed={0.2} radius={40} height={15} />

          {collectibleStates.map(c => (
            <Collectible key={c.id} position={c.position} isCollected={c.collected} />
          ))}

          <ContactShadows resolution={1024} scale={200} blur={1} opacity={0.25} far={50} color="#000000" />
          <Environment preset="park" />

          <Player
            platforms={[]}
            collectibles={collectibleStates}
            onCollect={handleCollect}
            onReset={() => {}}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">POLUTEK 3D</h1>
          <div className="space-y-1 text-white/80 text-sm">
            <p>⌨️ <span className="font-bold text-white">WASD</span>: Ruch</p>
            <p>🏃 <span className="font-bold text-white">Shift</span>: Bieg</p>
            <p>🚀 <span className="font-bold text-white">Spacja</span>: Skok</p>
            <p>💃 <span className="font-bold text-white">E</span>: Taniec</p>
            <p>👋 <span className="font-bold text-white">R</span>: Pomachaj</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
            <div className="bg-green-600/80 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl shadow-2xl">
                <p className="text-xs uppercase tracking-widest text-green-100 font-bold">Wynik</p>
                <p className="text-5xl font-black text-white tabular-nums">{score.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {score >= 2000 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[3rem] text-center animate-bounce">
                  <h2 className="text-7xl font-black text-white mb-2">WYGRANA! 🏆</h2>
                  <p className="text-xl text-white/60">Zebrałeś wszystkie toroidy na łące!</p>
              </div>
          </div>
      )}
    </div>
  );
}
