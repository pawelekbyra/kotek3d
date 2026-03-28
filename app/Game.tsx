'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, ContactShadows, Environment, useGLTF, useAnimations, Float,
  Instances, Instance, Loader, useProgress, Stars, Sparkles, Cloud, OrbitControls
} from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- Constants & Config ---
const MAP_SIZE = 600;
const NOISE_SCALE = 0.015;
const NOISE_STRENGTH = 8;

// --- Utilities ---
const noise2D = createNoise2D();

function getTerrainHeight(x: number, z: number) {
  // Now flat as requested
  return 0;
}

// --- Level Components ---

function Meadow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
      <meshStandardMaterial color="#2d5a27" roughness={0.8} />
    </mesh>
  );
}

function RunningTrack() {
  const curve = useMemo(() => {
    const points = [];
    const radius = 100;
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 4;
      const r = radius + Math.sin(angle * 0.5) * 40;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      points.push(new THREE.Vector3(x, 0.1, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const trackGeo = useMemo(() => new THREE.TubeGeometry(curve, 300, 3, 8, false), [curve]);

  return (
    <mesh geometry={trackGeo} receiveShadow>
      <meshStandardMaterial color="#444" roughness={1} />
    </mesh>
  );
}

function TreeInstance({ positions }: any) {
  return (
    <group>
      {positions.map((p: any, i: number) => (
        <Float key={i} speed={0.5} rotationIntensity={0.1} floatIntensity={0.1}>
          <group position={p} rotation={[0, Math.random() * Math.PI, 0]} scale={2 + Math.random()}>
            <mesh position={[0, 2, 0]} castShadow>
              <coneGeometry args={[1.5, 4, 8]} />
              <meshStandardMaterial color="#1a4d1a" />
            </mesh>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
              <meshStandardMaterial color="#4d2600" />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

function BushInstance({ positions }: any) {
  return (
    <group>
      {positions.map((p: any, i: number) => (
        <group key={i} position={p} rotation={[0, Math.random() * Math.PI, 0]} scale={0.8 + Math.random() * 0.5}>
          <mesh castShadow>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        </group>
      ))}
    </group>
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

// --- Player & Physics ---

function Duck({ id, pos, collected, onCollect }: any) {
  const { scene } = useGLTF('/Duck.glb');
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (collected || !ref.current) return;
    ref.current.rotation.y += 0.02;
    ref.current.position.y = pos[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
  });

  if (collected) return null;

  return (
    <group ref={ref} position={pos} scale={1.5}>
      <primitive object={scene.clone()} />
    </group>
  );
}

function Player({ gameStarted, obstacles, ducks, onCollect, onMove, playerRef }: any) {
  const group = playerRef;
  const { scene, animations } = useGLTF('/Cat.glb');
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, run: false, jump: false });
  const movementRef = useRef(movement);
  useEffect(() => { movementRef.current = movement; }, [movement]);

  useEffect(() => {
    if (!gameStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, forward: true })); break;
        case 's': setMovement(m => ({ ...m, backward: true })); break;
        case 'a': setMovement(m => ({ ...m, left: true })); break;
        case 'd': setMovement(m => ({ ...m, right: true })); break;
        case 'shift': setMovement(m => ({ ...m, run: true })); break;
        case ' ': setMovement(m => ({ ...m, jump: true })); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, forward: false })); break;
        case 's': setMovement(m => ({ ...m, backward: false })); break;
        case 'a': setMovement(m => ({ ...m, left: false })); break;
        case 'd': setMovement(m => ({ ...m, right: false })); break;
        case 'shift': setMovement(m => ({ ...m, run: false })); break;
        case ' ': setMovement(m => ({ ...m, jump: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameStarted]);

  const [currentAction, setCurrentAction] = useState('Idle');
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const isGrounded = useRef(true);

  useEffect(() => {
    if (!actions) return;
    let action = 'Idle';
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;
    if (!isGrounded.current) action = 'Jump';
    else if (isMoving) action = movement.run ? 'Run' : 'Walk';

    if (!actions[action]) {
        if (action === 'Run' && actions['Running']) action = 'Running';
        else if (action === 'Walk' && actions['Walking']) action = 'Walking';
        else if (action === 'Jump' && actions['WalkJump']) action = 'WalkJump';
        else action = Object.keys(actions)[0];
    }

    if (currentAction !== action && actions[action]) {
      actions[currentAction]?.fadeOut(0.2);
      const nextAction = actions[action];
      if (nextAction) {
        nextAction.reset().fadeIn(0.2).play();
      }
      setCurrentAction(action);
    }
  }, [movement, actions, currentAction]);

  useFrame((state, delta) => {
    if (!group.current || !gameStarted) return;

    const baseSpeed = movementRef.current.run ? 55 : 22;

    // Camera-relative movement
    const moveDir = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).negate();

    if (movementRef.current.forward) moveDir.add(cameraDirection);
    if (movementRef.current.backward) moveDir.sub(cameraDirection);
    if (movementRef.current.left) moveDir.sub(cameraRight);
    if (movementRef.current.right) moveDir.add(cameraRight);

    moveDir.normalize();

    if (moveDir.length() > 0) {
      // Face the direction of movement
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetAngle - group.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.current.rotation.y += diff * 0.7;
    }

    const moveDirection = moveDir.clone().multiplyScalar(baseSpeed);
    const nextX = group.current.position.x + moveDirection.x * delta;
    const nextZ = group.current.position.z + moveDirection.z * delta;

    // Simple Collision Detection
    let collision = false;
    const playerRadius = 1.2;

    // Check trees
    for (const tree of obstacles.trees) {
      const dx = nextX - tree[0];
      const dz = nextZ - tree[2];
      const distSq = dx * dx + dz * dz;
      if (distSq < Math.pow(playerRadius + 2, 2)) { // Tree radius ~2
        collision = true;
        break;
      }
    }

    // Check bushes
    if (!collision) {
      for (const bush of obstacles.bushes) {
        const dx = nextX - bush[0];
        const dz = nextZ - bush[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < Math.pow(playerRadius + 0.8, 2)) {
          collision = true;
          break;
        }
      }
    }

    if (!collision) {
      const movedDist = Math.sqrt(Math.pow(nextX - group.current.position.x, 2) + Math.pow(nextZ - group.current.position.z, 2));
      group.current.position.x = nextX;
      group.current.position.z = nextZ;
      if (movedDist > 0.01) onMove(movedDist);
    } else {
        // Sliding physics: try moving only X or only Z
        const canMoveX = !obstacles.trees.some((t: any) => Math.pow(nextX - t[0], 2) + Math.pow(group.current.position.z - t[2], 2) < Math.pow(playerRadius + 2, 2)) &&
                         !obstacles.bushes.some((b: any) => Math.pow(nextX - b[0], 2) + Math.pow(group.current.position.z - b[2], 2) < Math.pow(playerRadius + 0.8, 2));

        const canMoveZ = !obstacles.trees.some((t: any) => Math.pow(group.current.position.x - t[0], 2) + Math.pow(nextZ - t[2], 2) < Math.pow(playerRadius + 2, 2)) &&
                         !obstacles.bushes.some((b: any) => Math.pow(group.current.position.x - b[0], 2) + Math.pow(nextZ - b[2], 2) < Math.pow(playerRadius + 0.8, 2));

        if (canMoveX) {
            group.current.position.x = nextX;
            onMove(Math.abs(moveDirection.x * delta));
        } else if (canMoveZ) {
            group.current.position.z = nextZ;
            onMove(Math.abs(moveDirection.z * delta));
        }
    }

    // Duck Collection Detection
    for (const duck of ducks) {
      if (!duck.collected) {
        const dx = group.current.position.x - duck.pos[0];
        const dz = group.current.position.z - duck.pos[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < 4) { // Collection radius
          onCollect(duck.id);
        }
      }
    }

    const terrainH = getTerrainHeight(group.current.position.x, group.current.position.z);
    if (movementRef.current.jump && isGrounded.current) {
      velocity.current.y = 14;
      isGrounded.current = false;
    }
    velocity.current.y -= 35 * delta;
    group.current.position.y += velocity.current.y * delta;

    if (group.current.position.y <= terrainH) {
      group.current.position.y = terrainH;
      velocity.current.y = 0;
      isGrounded.current = true;
    }

  });

  return (
    <group ref={group} scale={0.025} rotation={[0, Math.PI, 0]} castShadow>
      <primitive object={scene} />
    </group>
  );
}

// --- UI Components ---

function CameraController({ playerRef }: { playerRef: React.RefObject<THREE.Group> }) {
  const { camera, controls } = useThree() as any;

  useFrame(() => {
    if (playerRef.current && controls) {
      const { x, y, z } = playerRef.current.position;
      controls.target.set(x, y + 2, z);
      controls.update();
    }
  });

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      minDistance={5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2.1}
      rotateSpeed={1.2}
    />
  );
}

function StartScreen({ onStart }: any) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-2xl">
      <div className="text-center">
        <h1 className="text-[10vw] font-black italic tracking-tighter text-white mb-2 leading-none">KOTEK 3D</h1>
        <p className="text-green-500 font-bold tracking-[0.5em] uppercase mb-12">Symulator Biegania</p>
        <button
          onClick={onStart}
          className="group px-16 py-8 bg-green-500 hover:bg-white text-black font-black text-3xl rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(34,197,94,0.3)]"
        >
          START BIEGU
        </button>
      </div>
    </div>
  );
}

// --- Main Game ---

export default function Game() {
  const playerRef = useRef<THREE.Group>(null!);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const { progress } = useProgress();

  const envData = useMemo(() => {
    const trees = [], bushes = [], ducks = [];
    for (let i = 0; i < 250; i++) {
        const x = (Math.random() - 0.5) * 550, z = (Math.random() - 0.5) * 550;
        trees.push([x, 0, z]);
    }
    for (let i = 0; i < 400; i++) {
        const x = (Math.random() - 0.5) * 580, z = (Math.random() - 0.5) * 580;
        bushes.push([x, 0, z]);
    }
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 500, z = (Math.random() - 0.5) * 500;
        ducks.push({ id: i, pos: [x, 0.5, z], collected: false });
    }
    return { trees, bushes, ducks };
  }, []);

  const [ducks, setDucks] = useState(envData.ducks);

  return (
    <div className="w-screen h-screen bg-sky-400 relative overflow-hidden">
      {!gameStarted && progress === 100 && <StartScreen onStart={() => setGameStarted(true)} />}

      {progress < 100 && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950">
          <div className="text-center">
            <div className="w-48 h-1 bg-white/10 rounded-full mb-4">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest">Generowanie świata...</p>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 15, 25], fov: 45 }}>
        <Suspense fallback={null}>
          <Sky distance={450000} sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={2} />
          <Cloud position={[-100, 50, -100]} speed={0.2} opacity={0.5} />
          <Cloud position={[100, 60, 100]} speed={0.1} opacity={0.5} />
          <Cloud position={[0, 40, -200]} speed={0.15} opacity={0.5} />

          <Sparkles count={500} scale={MAP_SIZE} size={2} speed={0.5} opacity={0.2} color="#fff" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[100, 200, 100]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-300} shadow-camera-right={300} shadow-camera-top={300} shadow-camera-bottom={-300} />

          <Meadow />
          <RunningTrack />

          <TreeInstance positions={envData.trees} />
          <BushInstance positions={envData.bushes} />

          <Bird url="/Flamingo.glb" position={[100, 40, 0]} speed={0.3} radius={100} height={20} />
          <Bird url="/Stork.glb" position={[-100, 50, -50]} speed={0.2} radius={120} height={25} />

          <ContactShadows resolution={1024} scale={MAP_SIZE} blur={2} opacity={0.2} far={100} color="#000" />
          <Environment preset="forest" />

          <CameraController playerRef={playerRef} />

          <Player
            playerRef={playerRef}
            gameStarted={gameStarted}
            obstacles={envData}
            ducks={ducks}
            onCollect={(id: number) => {
              setDucks(ds => ds.map(d => d.id === id ? { ...d, collected: true } : d));
              setScore(s => s + 1);
            }}
            onMove={(d: number) => setDistance(prev => prev + d)}
          />

          {ducks.map((duck: any) => (
            <Duck
              key={duck.id}
              {...duck}
              onCollect={(id: number) => {
                setDucks(ds => ds.map(d => d.id === id ? { ...d, collected: true } : d));
                setScore(s => s + 1);
              }}
            />
          ))}
        </Suspense>
      </Canvas>

      {gameStarted && (
        <div className="absolute top-12 left-12 p-8 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] pointer-events-none">
          <p className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">BIEG AKTYWNY</p>
          <div className="flex items-center gap-4">
            <div className="h-12 w-[2px] bg-white/20"></div>
            <div>
              <h2 className="text-4xl font-black text-white italic leading-none">KOTEK 3D</h2>
              <p className="text-white/40 text-xs">SYMULATOR V2</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl">
              <p className="text-[10px] text-white/40 uppercase mb-1">DYSTANS</p>
              <p className="text-2xl font-black text-white">{Math.floor(distance)}<span className="text-xs ml-1 opacity-40">m</span></p>
            </div>
            <div className="bg-green-500 p-4 rounded-2xl shadow-[0_10px_30px_rgba(34,197,94,0.3)]">
              <p className="text-[10px] text-black/40 uppercase mb-1 font-bold">KACZKI</p>
              <p className="text-2xl font-black text-black">{score}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
