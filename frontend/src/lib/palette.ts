import * as THREE from 'three';

/**
 * The interface's whole visual language in one place: near-black ground,
 * cyan/electric-blue neural structure, warm orange/gold intelligence core.
 * Every shader and material pulls from here so a palette tweak is one file.
 */
export const PALETTE = {
  bg: new THREE.Color('#030405'),
  cyan: new THREE.Color('#5fd8ff'),
  cyanDim: new THREE.Color('#2a6b7f'),
  orange: new THREE.Color('#ff8a3d'),
  orangeHot: new THREE.Color('#ffd08a'),
  coreBase: new THREE.Color('#7a2c00'),
  coreHot: new THREE.Color('#ffb454'),
  coreRim: new THREE.Color('#ffe1a8'),
  ink: new THREE.Color('#eef4f6'),
};
