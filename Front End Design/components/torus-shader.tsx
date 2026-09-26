"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

export function TorusShader() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [mouse3D, setMouse3D] = useState(new THREE.Vector3(0, 0, -10))
  const { camera } = useThree()

  // Create torus geometry with particles
  const { positions, count } = useMemo(() => {
    const torusGeometry = new THREE.TorusGeometry(1.5, 0.6, 128, 256)
    const positions = torusGeometry.attributes.position.array
    const count = positions.length / 3

    return { positions, count }
  }, [])

  // Custom shader material
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector3(0, 0, -10) },
          uMagnetStrength: { value: 0.9 },
        },
        vertexShader: `
          uniform float uTime;
          uniform vec3 uMouse;
          uniform float uMagnetStrength;
          varying float vDistanceFromCenter;
          varying float vMouseInfluence;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;
          
          void main() {
            vec3 pos = position;
            
            // Calculate distance from center of torus cross-section
            float radius = 1.5;
            float tubeRadius = 0.6;
            vec2 center = normalize(pos.xy) * radius;
            float distFromTube = length(pos.xy - center);
            vDistanceFromCenter = 1.0 - (distFromTube / tubeRadius);
            
            vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
            vWorldPosition = worldPos;
            vNormal = normalize((modelMatrix * vec4(normalize(pos), 0.0)).xyz);
            
            float distToMouse = length(worldPos - uMouse);
            float magneticInfluence = smoothstep(3.0, 0.0, distToMouse);
            magneticInfluence = pow(magneticInfluence, 0.7);
            vMouseInfluence = magneticInfluence;
            
            // Pull vertices towards mouse
            vec3 direction = normalize(uMouse - worldPos);
            vec3 perpendicular = cross(direction, vec3(0.0, 0.0, 1.0));
            pos += direction * magneticInfluence * uMagnetStrength;
            pos += perpendicular * magneticInfluence * 0.5 * sin(uTime * 2.0 + length(worldPos) * 3.0);
            
            float wave = sin(distToMouse * 5.0 - uTime * 3.0) * magneticInfluence * 0.2;
            pos += direction * wave;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = 2.0 + magneticInfluence * 2.0;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying float vDistanceFromCenter;
          varying float vMouseInfluence;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;
          
          vec3 getIridescentColor(vec3 worldPos, vec3 normal, float time) {
            float angle = atan(worldPos.y, worldPos.x);
            float height = worldPos.z;
            float colorShift = angle * 0.5 + height * 0.3 + time * 0.1;
            vec3 color1 = vec3(0.6, 0.8, 1.0); // soft blue
            vec3 color2 = vec3(0.8, 0.6, 1.0); // soft purple
            vec3 color3 = vec3(1.0, 0.7, 0.8); // soft pink
            vec3 iridescent = mix(color1, color2, sin(colorShift) * 0.5 + 0.5);
            iridescent = mix(iridescent, color3, cos(colorShift * 1.3) * 0.5 + 0.5);
            return iridescent;
          }
          
          void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            if (dist > 0.5) discard;
            
            float alpha = smoothstep(0.0, 0.8, vDistanceFromCenter);
            alpha = mix(alpha, 1.0, vMouseInfluence * 0.8);
            
            vec3 iridescent = getIridescentColor(vWorldPosition, vNormal, uTime);
            vec3 finalColor = mix(vec3(1.0), iridescent, 0.15);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const handlePointerMove = (event: any) => {
    if (!pointsRef.current) return

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(event.pointer, camera)

    const planeZ = pointsRef.current.position.z
    const planeNormal = new THREE.Vector3(0, 0, 1)
    const planePoint = new THREE.Vector3(0, 0, planeZ)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint)

    const intersectPoint = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, intersectPoint)

    if (intersectPoint) {
      setMouse3D(intersectPoint)
    }
  }

  // Animation loop
  useFrame((state) => {
    if (pointsRef.current && materialRef.current) {
      pointsRef.current.rotation.y += 0.005
      pointsRef.current.rotation.x += 0.002

      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uMouse.value.copy(mouse3D)
    }
  })

  return (
    <points ref={pointsRef} onPointerMove={handlePointerMove}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </points>
  )
}
