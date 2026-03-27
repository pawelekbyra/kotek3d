'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, ContactShadows, Environment, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#303030" />
    </mesh>
  );
}

function Player() {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('/RobotExpressive.glb');
  const { actions, names } = useAnimations(animations, group);
  const { camera } = useThree();

  // Log animations to see what's available
  useEffect(() => {
    console.log("Available animations:", names);
  }, [names]);

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
  });

  const movementRef = useRef(movement);
  useEffect(() => {
    movementRef.current = movement;
  }, [movement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setMovement((m) => ({ ...m, forward: true }));
          break;
        case 's':
        case 'arrowdown':
          setMovement((m) => ({ ...m, backward: true }));
          break;
        case 'a':
        case 'arrowleft':
          setMovement((m) => ({ ...m, left: true }));
          break;
        case 'd':
        case 'arrowright':
          setMovement((m) => ({ ...m, right: true }));
          break;
        case 'shift':
          setMovement((m) => ({ ...m, run: true }));
          break;
        case ' ':
          setMovement((m) => ({ ...m, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setMovement((m) => ({ ...m, forward: false }));
          break;
        case 's':
        case 'arrowdown':
          setMovement((m) => ({ ...m, backward: false }));
          break;
        case 'a':
        case 'arrowleft':
          setMovement((m) => ({ ...m, left: false }));
          break;
        case 'd':
        case 'arrowright':
          setMovement((m) => ({ ...m, right: false }));
          break;
        case 'shift':
          setMovement((m) => ({ ...m, run: false }));
          break;
        case ' ':
          setMovement((m) => ({ ...m, jump: false }));
          break;
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
  const jumpVelocity = useRef(0);
  const isJumping = useRef(false);

  useEffect(() => {
    if (!actions) return;
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;

    let action = 'Idle';
    if (isJumping.current) {
        action = 'Jump';
    } else if (isMoving) {
        action = movement.run ? 'Running' : 'Walking';
    }

    if (currentAction !== action) {
      const nextAction = actions[action];
      const prevAction = actions[currentAction];

      if (prevAction) {
        prevAction.fadeOut(0.2);
      }
      if (nextAction) {
        nextAction.reset().fadeIn(0.2).play();
        if (action === 'Jump') {
            // Jump animation logic might need to be clamped or handled specially if it's not a loop
            nextAction.setLoop(THREE.LoopOnce, 1);
            nextAction.clampWhenFinished = true;
        }
      }
      setCurrentAction(action);
    }
  }, [movement, actions, currentAction]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const baseSpeed = movementRef.current.run ? 10 : 5;
    const moveSpeed = baseSpeed * delta;
    const rotateSpeed = 3 * delta;

    // Movement logic
    if (movementRef.current.forward) {
      group.current.translateZ(moveSpeed);
    }
    if (movementRef.current.backward) {
      group.current.translateZ(-moveSpeed);
    }
    if (movementRef.current.left) {
      group.current.rotation.y += rotateSpeed;
    }
    if (movementRef.current.right) {
      group.current.rotation.y -= rotateSpeed;
    }

    // Jump physics (simple)
    if (movementRef.current.jump && !isJumping.current) {
        isJumping.current = true;
        jumpVelocity.current = 10;
    }

    if (isJumping.current) {
        group.current.position.y += jumpVelocity.current * delta;
        jumpVelocity.current -= 25 * delta; // Gravity

        if (group.current.position.y <= 0) {
            group.current.position.y = 0;
            isJumping.current = false;
            jumpVelocity.current = 0;
        }
    }

    // Third person camera follow
    const relativeCameraOffset = new THREE.Vector3(0, 5, -10);
    const cameraOffset = relativeCameraOffset.applyMatrix4(group.current.matrixWorld);

    state.camera.position.lerp(cameraOffset, 0.1);
    state.camera.lookAt(
        group.current.position.x,
        group.current.position.y + 2,
        group.current.position.z
    );
  });

  return (
    <group ref={group} dispose={null} scale={0.5} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/RobotExpressive.glb');

export default function Game() {
  const [showHelp, setShowHelp] = useState(true);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#101010' }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <directionalLight
            position={[-10, 20, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          <Ground />
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.35} far={10} color="#000000" />
          <Environment preset="city" />

          <Player />

        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none', zIndex: 10 }}>
        <h1 className="text-3xl font-black italic tracking-tighter">POLUTEK 3D</h1>
        <div className="mt-4 space-y-1 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <p>⌨️ <span className="font-bold">WASD / Strzałki</span>: Ruch</p>
            <p>🏃 <span className="font-bold">Shift</span>: Bieg</p>
            <p>🚀 <span className="font-bold">Spacja</span>: Skok</p>
        </div>
      </div>
    </div>
  );
}
