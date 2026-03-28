'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, Environment, useGLTF, useAnimations, OrbitControls, useProgress, Float, ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';

// --- Global state for cannonballs to avoid React state lag in useFrame ---
const cannonballs: any[] = [];

// --- Cannonball Component ---

function Cannonball({ id, position, direction, onRemove }: any) {
  const ref = useRef<THREE.Mesh>(null!);
  const speed = 150;
  const gravity = 15;
  const velocity = useRef(direction.clone().multiplyScalar(speed));
  const life = useRef(4); // 4 seconds life
  const initialPos = useMemo(() => position.clone(), [position]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    velocity.current.y -= gravity * delta;
    ref.current.position.add(velocity.current.clone().multiplyScalar(delta));

    // Update global state for collision detection
    const index = cannonballs.findIndex(cb => cb.id === id);
    if (index !== -1) {
        cannonballs[index].pos.copy(ref.current.position);
    }

    life.current -= delta;
    if (life.current <= 0 || ref.current.position.y < -10) {
      const idx = cannonballs.findIndex(cb => cb.id === id);
      if (idx !== -1) cannonballs.splice(idx, 1);
      onRemove(id);
    }
  });

  return (
    <mesh ref={ref} position={initialPos} castShadow>
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial color="#111" roughness={0.05} metalness={0.95} />
    </mesh>
  );
}

// --- Enemy Logic ---

function EnemyShip({ id, initialPos, playerRef, onHit }: any) {
  const { scene } = useGLTF('/ship.glb') as any;
  const ref = useRef<THREE.Group>(null!);
  const [destroyed, setDestroyed] = useState(false);
  const pos = useMemo(() => new THREE.Vector3(...initialPos), [initialPos]);

  useFrame((state, delta) => {
    if (destroyed || !ref.current) return;

    // Check collision with cannonballs
    for (let i = 0; i < cannonballs.length; i++) {
        const cb = cannonballs[i];
        const dist = ref.current.position.distanceTo(cb.pos);
        if (dist < 12) { // Ship collision radius
            setDestroyed(true);
            onHit();
            // Remove cannonball from global state and trigger its removal
            cannonballs.splice(i, 1);
            break;
        }
    }

    if (destroyed) return;

    // AI: rotate towards player
    if (playerRef.current) {
      const direction = new THREE.Vector3().subVectors(playerRef.current.position, ref.current.position);
      const angle = Math.atan2(direction.x, direction.z);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, angle, 0.2 * delta);
    }

    // Ship "bobbing" effect
    ref.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5 + pos.x) * 0.3;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 1.2 + pos.z) * 0.05;
    ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.8 + pos.x) * 0.05;
  });

  if (destroyed) return null;

  return (
    <group ref={ref} position={pos} scale={4} rotation={[0, Math.random() * Math.PI, 0]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// --- Player Ship Logic ---

function Ship({ playerRef, gameStarted, onFire }: any) {
  const { scene } = useGLTF('/ship.glb') as any;
  const ref = playerRef;
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false });
  const movementRef = useRef(movement);
  useEffect(() => { movementRef.current = movement; }, [movement]);

  const velocity = useRef(0);
  const rotationVelocity = useRef(0);

  useEffect(() => {
    if (!gameStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, forward: true })); break;
        case 's': setMovement(m => ({ ...m, backward: true })); break;
        case 'a': setMovement(m => ({ ...m, left: true })); break;
        case 'd': setMovement(m => ({ ...m, right: true })); break;
        case ' ': onFire(); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, forward: false })); break;
        case 's': setMovement(m => ({ ...m, backward: false })); break;
        case 'a': setMovement(m => ({ ...m, left: false })); break;
        case 'd': setMovement(m => ({ ...m, right: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameStarted, onFire]);

  useFrame((state, delta) => {
    if (!ref.current || !gameStarted) return;

    // Movement with inertia
    const accel = 30.0;
    const drag = 1.0;
    const maxSpeed = 50.0;
    const turnSpeed = 2.0;

    if (movementRef.current.forward) velocity.current += accel * delta;
    if (movementRef.current.backward) velocity.current -= accel * delta;

    velocity.current = Math.max(-maxSpeed/2, Math.min(maxSpeed, velocity.current));
    velocity.current -= velocity.current * drag * delta;

    if (movementRef.current.left) rotationVelocity.current += turnSpeed * delta;
    if (movementRef.current.right) rotationVelocity.current -= turnSpeed * delta;

    rotationVelocity.current -= rotationVelocity.current * 4.0 * delta;

    ref.current.rotation.y += rotationVelocity.current;

    const moveDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(ref.current.quaternion);
    ref.current.position.add(moveDirection.multiplyScalar(velocity.current * delta));

    // Ship "bobbing" effect
    ref.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.3;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 1.2) * 0.05;
    ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.05 + rotationVelocity.current * 0.5;
  });

  return (
    <group ref={ref} scale={4} castShadow>
      <primitive object={scene} />
    </group>
  );
}

// --- Sea Environment ---

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = -1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -1, 0]}>
      <planeGeometry args={[4000, 4000, 100, 100]} />
      <meshStandardMaterial
        color="#003366"
        roughness={0.02}
        metalness={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// --- Main Game ---

function CameraController({ playerRef }: any) {
  const { controls } = useThree() as any;

  useFrame(() => {
    if (playerRef.current && controls) {
      const { x, y, z } = playerRef.current.position;
      controls.target.lerp(new THREE.Vector3(x, y + 5, z), 0.1);
      controls.update();
    }
  });

  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2.2}
      minDistance={50}
      maxDistance={300}
    />
  );
}

export default function Game() {
  const playerRef = useRef<THREE.Group>(null!);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const { progress } = useProgress();

  const [activeCannonballs, setActiveCannonballs] = useState<any[]>([]);

  const enemiesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 250 + Math.random() * 450;
        data.push({
            id: i,
            initialPos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
        });
    }
    return data;
  }, []);

  const handleFire = useCallback(() => {
    if (!playerRef.current) return;
    const id = Date.now() + Math.random();
    const position = playerRef.current.position.clone();
    position.y += 6;
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(playerRef.current.quaternion);

    // Add to global state for physics/collision
    cannonballs.push({ id, pos: position.clone() });

    // Add to React state for rendering
    setActiveCannonballs(prev => [...prev, { id, position, direction }]);
  }, []);

  const removeCannonball = useCallback((id: number) => {
    setActiveCannonballs(prev => prev.filter(cb => cb.id !== id));
  }, []);

  return (
    <div className="w-screen h-screen bg-zinc-950 relative overflow-hidden text-white font-sans selection:bg-blue-500/30">
      {progress < 100 && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <div className="w-64 h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-blue-500/50 text-[10px] uppercase font-black tracking-[0.5em] animate-pulse">Inicjalizacja Systemów Morskich</p>
          </div>
        </div>
      )}

      {!gameStarted && progress === 100 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm">
          <div className="text-center p-20 bg-zinc-950/40 rounded-[5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <h1 className="text-[12vw] font-black tracking-tighter italic mb-4 drop-shadow-2xl leading-none select-none">STATKI 3D</h1>
            <p className="text-blue-500 font-bold tracking-[0.8em] uppercase mb-16 text-sm opacity-60">Bitwa o Panowanie na Oceanie</p>
            <button
              onClick={() => setGameStarted(true)}
              className="px-20 py-10 bg-blue-600 hover:bg-white hover:text-blue-900 font-black text-4xl rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_80px_rgba(37,99,235,0.5)] ring-1 ring-white/10"
            >
              ROZPOCZNIJ BITWĘ
            </button>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 80, 150], fov: 45 }}>
        <Suspense fallback={null}>
          <Sky distance={450000} sunPosition={[10, 5, 10]} turbidity={0.05} rayleigh={1} />
          <fog attach="fog" args={['#050510', 100, 1200]} />

          <ambientLight intensity={0.2} />
          <directionalLight
            position={[100, 300, 100]}
            intensity={2}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-left={-600}
            shadow-camera-right={600}
            shadow-camera-top={600}
            shadow-camera-bottom={-600}
          />

          <Ocean />

          <Ship
            playerRef={playerRef}
            gameStarted={gameStarted}
            onFire={handleFire}
          />

          {enemiesData.map((e) => (
            <EnemyShip
                key={e.id}
                id={e.id}
                initialPos={e.initialPos}
                playerRef={playerRef}
                onHit={() => setScore(s => s + 1)}
            />
          ))}

          {activeCannonballs.map((cb) => (
            <Cannonball
                key={cb.id}
                {...cb}
                onRemove={removeCannonball}
            />
          ))}

          <CameraController playerRef={playerRef} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {gameStarted && (
        <div className="absolute top-16 left-16 p-12 bg-zinc-950/60 backdrop-blur-3xl border border-white/5 rounded-[4rem] pointer-events-none shadow-3xl">
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.6em] mb-4 font-mono opacity-60">OPERACJA MORSKA TRWA</p>
          <h2 className="text-6xl font-black italic leading-none tracking-tighter mb-12">STATKI 3D</h2>

          <div className="flex flex-col gap-2">
             <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">WROGOSTKI ZATOPIONE</p>
             <p className="text-[8rem] font-black text-blue-500 leading-none drop-shadow-2xl">{score}</p>
          </div>

          <div className="mt-16 pt-12 border-t border-white/5 grid grid-cols-2 gap-12 text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">
            <div className="flex flex-col gap-3">
                <p className="text-blue-500 opacity-50">MANEWRY</p>
                <div className="flex gap-4">
                   <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">[W][A][S][D]</span>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <p className="text-blue-500 opacity-50">SALWA</p>
                <div className="flex gap-4">
                   <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">[SPACJA]</span>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Crosshair */}
      {gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 border-2 border-white/5 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
        </div>
      )}
    </div>
  );
}
