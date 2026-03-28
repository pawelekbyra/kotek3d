'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, ContactShadows, Environment, Stars,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- Types ---

interface EnemyData {
  id: number;
  pos: [number, number, number];
  dead: boolean;
}

interface ProjectileData {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
}

// --- Global Config ---
const MAP_SIZE = 1000;
const noise2D = createNoise2D();

function getWaveHeight(x: number, z: number, time: number) {
  return (
    Math.sin(x * 0.05 + time * 1.5) * 0.8 +
    Math.cos(z * 0.04 + time * 1.2) * 0.8 +
    noise2D(x * 0.01, z * 0.01 + time * 0.1) * 1.5
  );
}

// --- Components ---

function Sea() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getWaveHeight(x, z, time));
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[MAP_SIZE, MAP_SIZE, 64, 64]} />
      <meshStandardMaterial
        color="#001a33"
        roughness={0.05}
        metalness={0.9}
        transparent
        opacity={1}
        flatShading
      />
    </mesh>
  );
}

function ShipModel({ color = "#4d2600" }: { color?: string }) {
  return (
    <group>
      {/* Hull */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[4, 1.5, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1, 5]} castShadow>
        <coneGeometry args={[2, 4, 4]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Mast */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 8]} />
        <meshStandardMaterial color="#331a00" />
      </mesh>

      {/* Sails */}
      <mesh position={[0, 6, 0.5]} castShadow>
        <boxGeometry args={[5, 4, 0.1]} />
        <meshStandardMaterial color="#f2f2f2" side={THREE.DoubleSide} />
      </mesh>

      {/* Deck bits */}
      <mesh position={[0, 2, -3]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Projectile({ position, velocity }: { position: THREE.Vector3; velocity: THREE.Vector3 }) {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.position.add(velocity.clone().multiplyScalar(delta));
        velocity.y -= 9.8 * delta; // Gravity
    });

    return (
        <mesh ref={meshRef} position={position} castShadow>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshStandardMaterial color="#222" metalness={1} roughness={0.2} />
        </mesh>
    );
}

interface PlayerProps {
    enemies: EnemyData[];
    onHit: (id: number) => void;
}

function Player({ enemies, onHit }: PlayerProps) {
  const shipRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const [velocity, setVelocity] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);

  const keys = useRef<Record<string, boolean>>({});

  const fire = useCallback(() => {
    if (!shipRef.current) return;
    const pos = shipRef.current.position.clone().add(new THREE.Vector3(0, 2, 0));
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipRef.current.quaternion);
    const vel = dir.multiplyScalar(70).add(new THREE.Vector3(0, 12, 0));
    setProjectiles(prev => [...prev, { id: Date.now() + Math.random(), pos, vel }]);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        keys.current[e.key.toLowerCase()] = true;
        if (e.key === ' ') fire();
    };
    const up = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
    };
  }, [fire]);

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    // Bobbing & Rotation
    const time = state.clock.getElapsedTime();
    const x = shipRef.current.position.x;
    const z = shipRef.current.position.z;
    const h = getWaveHeight(x, z, time);
    shipRef.current.position.y = h - 0.5;

    const hNext = getWaveHeight(x, z + 1, time);
    shipRef.current.rotation.x = THREE.MathUtils.lerp(shipRef.current.rotation.x, (h - hNext) * 0.5, 0.1);

    // Movement
    if (keys.current['w']) setVelocity(v => Math.min(v + 12 * delta, 28));
    if (keys.current['s']) setVelocity(v => Math.max(v - 15 * delta, -10));
    if (!keys.current['w'] && !keys.current['s']) setVelocity(v => v * 0.98);

    if (keys.current['a']) setRotation(r => r + 1.8 * delta);
    if (keys.current['d']) setRotation(r => r - 1.8 * delta);
    setRotation(r => r * 0.95);

    shipRef.current.rotation.y += rotation * delta;
    const moveDir = new THREE.Vector3(0, 0, 1).applyQuaternion(shipRef.current.quaternion);
    shipRef.current.position.add(moveDir.multiplyScalar(velocity * delta));

    // Collision Detection & Projectile Cleanup
    setProjectiles(prev => {
        const next = [];
        for (const p of prev) {
            // Update position in the state object as well for collision check
            p.pos.add(p.vel.clone().multiplyScalar(delta));
            p.vel.y -= 9.8 * delta;

            let hit = false;
            if (p.pos.y < -2) hit = true; // Hit water

            for (const enemy of enemies) {
                if (enemy.dead) continue;
                const dist = p.pos.distanceTo(new THREE.Vector3(...enemy.pos));
                if (dist < 6) { // Collision radius
                    onHit(enemy.id);
                    hit = true;
                    break;
                }
            }

            if (!hit && p.pos.length() < 1000) {
                next.push(p);
            }
        }
        return next;
    });

    // Camera follow
    const camOffset = new THREE.Vector3(0, 18, -40).applyQuaternion(shipRef.current.quaternion);
    camera.position.lerp(shipRef.current.position.clone().add(camOffset), 0.1);
    camera.lookAt(shipRef.current.position.clone().add(new THREE.Vector3(0, 5, 0)));
  });

  return (
    <group>
        <group ref={shipRef}>
            <ShipModel />
            <PerspectiveCamera makeDefault position={[0, 15, -30]} />
        </group>
        {projectiles.map(p => (
            <Projectile key={p.id} position={p.pos} velocity={p.vel} />
        ))}
    </group>
  );
}

function Enemy({ position, dead }: { position: [number, number, number]; dead: boolean }) {
    const ref = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (dead || !ref.current) return;
        const time = state.clock.getElapsedTime();
        ref.current.position.y = getWaveHeight(ref.current.position.x, ref.current.position.z, time) - 0.5;
        ref.current.rotation.y += 0.005;

        // Dynamic tilt for enemy
        const h = getWaveHeight(ref.current.position.x, ref.current.position.z, time);
        const hNext = getWaveHeight(ref.current.position.x, ref.current.position.z + 1, time);
        ref.current.rotation.x = (h - hNext) * 0.4;
    });

    if (dead) return null;

    return (
        <group ref={ref} position={position} scale={0.8}>
            <ShipModel color="#800000" />
        </group>
    );
}

// --- Main Scene ---

export default function Game() {
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [enemies, setEnemies] = useState<EnemyData[]>(() => {
      const arr: EnemyData[] = [];
      for(let i=0; i<25; i++) {
          arr.push({
              id: i,
              pos: [(Math.random()-0.5)*500, 0, (Math.random()-0.5)*500],
              dead: false
          });
      }
      return arr;
  });

  const handleHit = useCallback((id: number) => {
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true } : e));
      setScore(s => s + 1);
  }, []);

  return (
    <div className="w-screen h-screen bg-sky-950 relative overflow-hidden font-sans">
      {!gameStarted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
              <div className="text-center px-4">
                  <h1 className="text-6xl md:text-8xl font-black italic text-white tracking-tighter mb-4">STATKI 3D</h1>
                  <p className="text-blue-400 font-bold uppercase tracking-[0.4em] mb-12">Bitwa o Ocean</p>
                  <button
                    onClick={() => setGameStarted(true)}
                    className="px-12 py-6 bg-blue-600 hover:bg-white text-white hover:text-black font-black text-2xl rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(37,99,235,0.5)]"
                  >
                    ROZPOCZNIJ BITWĘ
                  </button>
                  <div className="mt-12 flex flex-col gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <div>WASD - Sterowanie Statkiem</div>
                      <div>SPACJA - Strzał z Armat</div>
                      <div>MYSZKA - Obracanie kamery (opcjonalnie)</div>
                  </div>
              </div>
          </div>
      )}

      <Canvas shadows gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#000810']} />
          <Sky distance={450000} sunPosition={[0, -1, 0]} turbidity={0.1} rayleigh={1} />
          <Stars radius={300} depth={60} count={10000} factor={7} saturation={0} fade speed={1} />
          <ambientLight intensity={0.4} />
          <pointLight position={[100, 100, 100]} intensity={1} castShadow />
          <directionalLight position={[-50, 50, -50]} intensity={0.5} />

          <Sea />

          {gameStarted && <Player enemies={enemies} onHit={handleHit} />}

          {enemies.map(e => (
              <Enemy key={e.id} position={e.pos} dead={e.dead} />
          ))}

          <Environment preset="night" />
          <ContactShadows opacity={0.4} scale={20} blur={2.4} far={10} />
          <fog attach="fog" args={['#001a33', 10, 450]} />
        </Suspense>
      </Canvas>

      {gameStarted && (
          <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-white select-none">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Status Floty</p>
              <h2 className="text-3xl font-black italic">W WALCE</h2>
              <div className="mt-4 flex gap-4">
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <p className="text-[10px] opacity-40 uppercase font-bold">Zatopione</p>
                      <p className="text-2xl font-black text-blue-400">{score}</p>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <p className="text-[10px] opacity-40 uppercase font-bold">Pozostało</p>
                      <p className="text-2xl font-black">{enemies.filter(e => !e.dead).length}</p>
                  </div>
              </div>
          </div>
      )}

      {gameStarted && enemies.every(e => e.dead) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-600/20 backdrop-blur-md">
              <div className="text-center">
                  <h2 className="text-7xl font-black italic text-white mb-4">ZWYCIĘSTWO!</h2>
                  <p className="text-white/80 uppercase tracking-widest mb-8">Wszystkie wrogie statki zatopione</p>
                  <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white text-black font-bold rounded-full">ZAGRAJ PONOWNIE</button>
              </div>
          </div>
      )}
    </div>
  );
}
