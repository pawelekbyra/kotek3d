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
  const { actions } = useAnimations(animations, group);
  const { camera } = useThree();

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
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

  useEffect(() => {
    if (!actions) return;
    const isMoving = movement.forward || movement.backward || movement.left || movement.right;
    const action = isMoving ? 'Walking' : 'Idle';

    if (currentAction !== action) {
      const nextAction = actions[action];
      const prevAction = actions[currentAction];

      if (prevAction) {
        prevAction.fadeOut(0.2);
      }
      if (nextAction) {
        nextAction.reset().fadeIn(0.2).play();
      }
      setCurrentAction(action);
    }
  }, [movement, actions, currentAction]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const moveSpeed = 5 * delta;
    const rotateSpeed = 3 * delta;

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
        <h1 className="text-2xl font-bold">3D Game</h1>
        <p>Użyj WASD lub strzałek do poruszania się</p>
      </div>
    </div>
  );
}
