'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, ContactShadows, Environment, useGLTF, useAnimations, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Level Components ---

function Platform({ position, args = [5, 0.5, 5], color = "#404040" }: any) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
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

function Lava() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -2, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#ff4400" emissive="#ff0000" emissiveIntensity={2} />
    </mesh>
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

    velocity.current.y -= 20 * delta; // Reduced gravity from 25 for floatier feel
    group.current.position.y += velocity.current.y * delta;

    // Collision detection (very simple)
    let grounded = false;
    platforms.forEach((p: any) => {
      const [px, py, pz] = p.position;
      const [pw, ph, pd] = p.args;

      const halfW = pw / 2;
      const halfH = ph / 2;
      const halfD = pd / 2;

      // Check if within X and Z bounds
      if (
        group.current.position.x >= px - halfW &&
        group.current.position.x <= px + halfW &&
        group.current.position.z >= pz - halfD &&
        group.current.position.z <= pz + halfD
      ) {
        // Check if hitting from top
        const platformTop = py + halfH;
        if (
          group.current.position.y <= platformTop &&
          group.current.position.y >= py - halfH &&
          velocity.current.y <= 0
        ) {
          group.current.position.y = platformTop;
          velocity.current.y = 0;
          grounded = true;
        }
      }
    });

    isGrounded.current = grounded;

    // Proximity Collectibles
    collectibles.forEach((c: any) => {
      if (!c.collected) {
        const dist = group.current.position.distanceTo(new THREE.Vector3(...c.position));
        if (dist < 1.5) {
          onCollect(c.id);
        }
      }
    });

    // Reset if fallen
    if (group.current.position.y < -5) {
        group.current.position.set(0, 5, 0); // Spawn a bit higher
        group.current.rotation.set(0, Math.PI, 0);
        velocity.current.set(0, 0, 0);
        onReset();
    }

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
  const [deaths, setDeaths] = useState(0);

  const platforms = useMemo(() => [
    { position: [0, -0.25, 0], args: [12, 0.5, 12], color: "#333" }, // Enlarged base
    { position: [0, -0.25, 10], args: [6, 0.5, 6], color: "#444" },
    { position: [12, 1, 8], args: [6, 0.5, 6], color: "#555" }, // Adjusted height and distance
    { position: [-12, 1.5, 10], args: [6, 0.5, 6], color: "#444" },
    { position: [8, 3.5, -5], args: [5, 0.5, 5], color: "#666" },
    { position: [-8, 5, -12], args: [5, 0.5, 5], color: "#555" },
    { position: [0, 7, -18], args: [4, 0.5, 4], color: "#444" }, // Added more verticality
    { position: [10, 9, -20], args: [4, 0.5, 4], color: "#333" },
  ], []);

  const [collectibleStates, setCollectibleStates] = useState([
    { id: 1, position: [0, 1, 10], collected: false },
    { id: 2, position: [12, 2.5, 8], collected: false },
    { id: 3, position: [-12, 3, 10], collected: false },
    { id: 4, position: [8, 5, -5], collected: false },
    { id: 5, position: [-8, 6.5, -12], collected: false },
    { id: 6, position: [0, 8.5, -18], collected: false },
    { id: 7, position: [10, 10.5, -20], collected: false },
  ]);

  const handleCollect = (id: number) => {
    setCollectibleStates(prev => prev.map(c => c.id === id ? { ...c, collected: true } : c));
    setScore(s => s + 100);
  };

  return (
    <div className="w-screen h-screen bg-[#101010] relative">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <directionalLight position={[-10, 20, 10]} intensity={1.5} castShadow />

          {platforms.map((p, i) => (
            <Platform key={i} position={p.position} args={p.args} color={p.color} />
          ))}

          <Lava />

          <Bird url="/Flamingo.glb" position={[10, 5, 0]} speed={0.5} radius={15} height={5} />
          <Bird url="/Parrot.glb" position={[-15, 8, 5]} speed={0.8} radius={10} height={3} />
          <Bird url="/Stork.glb" position={[0, 12, -10]} speed={0.3} radius={20} height={10} />

          {collectibleStates.map(c => (
            <Collectible key={c.id} position={c.position} isCollected={c.collected} />
          ))}

          <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.35} far={20} color="#000000" />
          <Environment preset="city" />

          <Player
            platforms={platforms}
            collectibles={collectibleStates}
            onCollect={handleCollect}
            onReset={() => setDeaths(d => d + 1)}
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
            <div className="bg-blue-600/80 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl shadow-2xl">
                <p className="text-xs uppercase tracking-widest text-blue-100 font-bold">Wynik</p>
                <p className="text-5xl font-black text-white tabular-nums">{score.toLocaleString()}</p>
            </div>
            <div className="bg-red-600/80 backdrop-blur-md border border-white/20 px-6 py-2 rounded-xl shadow-xl">
                <p className="text-xs uppercase tracking-widest text-red-100 font-bold">Skuchy: {deaths}</p>
            </div>
        </div>
      </div>

      {score >= 700 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[3rem] text-center animate-bounce">
                  <h2 className="text-7xl font-black text-white mb-2">WYGRANA! 🏆</h2>
                  <p className="text-xl text-white/60">Zebrałeś wszystkie toroidy!</p>
              </div>
          </div>
      )}
    </div>
  );
}
