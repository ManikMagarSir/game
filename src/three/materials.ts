import * as THREE from 'three'
import { crateTexture, groundTexture, rockTexture } from './textures'

// Shared geometries + cached materials. Single BoxGeometry reuse fixes
// legacy per-mesh `new BoxGeometry` churn (js/world.js, js/models/*).
export const unitBox = new THREE.BoxGeometry(1, 1, 1)
export const tileBox = new THREE.BoxGeometry(4, 1, 4)

let _mats: {
  groundA?: THREE.MeshLambertMaterial
  groundB?: THREE.MeshLambertMaterial
  crate?: THREE.MeshLambertMaterial
  crateTint?: THREE.MeshLambertMaterial
  rock?: THREE.MeshLambertMaterial
  trunk?: THREE.MeshLambertMaterial
  leaf?: THREE.MeshLambertMaterial
} = {}

export function groundMatA(): THREE.MeshLambertMaterial {
  if (!_mats.groundA) _mats.groundA = new THREE.MeshLambertMaterial({ map: groundTexture(true) })
  return _mats.groundA
}
export function groundMatB(): THREE.MeshLambertMaterial {
  if (!_mats.groundB) _mats.groundB = new THREE.MeshLambertMaterial({ map: groundTexture(false) })
  return _mats.groundB
}
export function crateMat(): THREE.MeshLambertMaterial {
  if (!_mats.crate) _mats.crate = new THREE.MeshLambertMaterial({ map: crateTexture() })
  return _mats.crate
}
export function crateTintMat(): THREE.MeshLambertMaterial {
  if (!_mats.crateTint) _mats.crateTint = new THREE.MeshLambertMaterial({ map: crateTexture(), color: 0x8899aa })
  return _mats.crateTint
}
export function rockMat(): THREE.MeshLambertMaterial {
  if (!_mats.rock) _mats.rock = new THREE.MeshLambertMaterial({ map: rockTexture() })
  return _mats.rock
}
export function trunkMat(): THREE.MeshLambertMaterial {
  if (!_mats.trunk) _mats.trunk = new THREE.MeshLambertMaterial({ color: 0x5a3b22 })
  return _mats.trunk
}
export function leafMat(): THREE.MeshLambertMaterial {
  if (!_mats.leaf) _mats.leaf = new THREE.MeshLambertMaterial({ color: 0x2f6b34 })
  return _mats.leaf
}
