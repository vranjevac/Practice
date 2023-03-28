// Question Reference: discourse.threejs.org/t/multiple-uvs-material-for-one-single-mesh-is-it-somehow-possible/20458

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CubeTextureLoader, TextureLoader, Vector3 } from 'three'

let camera, scene, renderer, controls, ground, lightPrimary, lightSecondary;

// NOTE Usage:
//  remapMaterialUVs(child.material, {
//    'emissiveMap': 'texcoord_2', // <- fourth UV map
//    'roughnessMap': 'texcoord_3' // <- fifth UV map
//  });

const remapMaterialUVs = (material, remapUVs, {
  uvAttributePrefix,
  uvAttributeOffset
} = {}) => {
  const _uvAttributePrefix = uvAttributePrefix || 'texcoord_';
  const _uvAttributeOffset = 2;
  
  material.customProgramCacheKey = () => Math.random();
  material.onBeforeCompile = (shader, context) => {  
    const resolveIncludes = (shader) => {
      // NOTE Straight from three/WebGLProgram.js
      const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

      return shader.replace(includePattern, (match, include) => {
        const string = THREE.ShaderChunk[include];

        if (!string) {
          return;
        }

        return resolveIncludes(string);
      });
    };

    let maxTexCoordIndex = 0;
    const texCoordSwaps = [];

    Object.entries(remapUVs).forEach(([ textureType, uvMap ]) => {
      if (!uvMap.startsWith(_uvAttributePrefix)) {
        console.warn('Invalid UVMap name', uvMap);

        return;
      }

      const texCoordIndex = parseFloat(uvMap.split(new RegExp(`${_uvAttributePrefix}\\D*`, 'gi')).join(''));

      maxTexCoordIndex = Math.max(texCoordIndex, maxTexCoordIndex);
      texCoordSwaps[textureType] = texCoordIndex;
    });

    if (maxTexCoordIndex - 1 <= 0) {
      return;
    }

    shader.vertexShader = shader.vertexShader.replace(`#include <uv2_pars_vertex>`, `
      ${Array(maxTexCoordIndex - 1).fill(0).map((_, index) => `
        attribute vec2 ${_uvAttributePrefix}${index + _uvAttributeOffset};
        varying vec2 vTexCoord${index + _uvAttributeOffset};
      `).join('\n')}

      #include <uv2_pars_vertex>
    `).replace(`#include <uv2_vertex>`, `
      ${Array(maxTexCoordIndex - 1).fill(0).map((_, index) => `
        vTexCoord${index + _uvAttributeOffset} = ( vec3( ${_uvAttributePrefix}${index + _uvAttributeOffset}, 1 ) ).xy;
      `).join('\n')}

      #include <uv2_vertex>
    `);

    shader.fragmentShader = shader.fragmentShader.replace(`#include <uv2_pars_fragment>`, `
      ${Array(maxTexCoordIndex - 1).fill(0).map((_, index) => `
        varying vec2 vTexCoord${index + _uvAttributeOffset};
      `).join('\n')}

      #include <uv2_pars_fragment>
    `);

    shader.vertexShader = resolveIncludes(shader.vertexShader);
    shader.fragmentShader = resolveIncludes(shader.fragmentShader);

    Object.entries(texCoordSwaps).forEach(([ textureType, texCoordIndex ]) => {
      shader.fragmentShader = shader.fragmentShader.replaceAll(
        `texture2D( ${textureType}, vUv )`,
        `texture2D( ${textureType}, vTexCoord${texCoordIndex} )`
       ).replaceAll(
        `texture2D( ${textureType}, vUv2 )`,
        `texture2D( ${textureType}, vTexCoord${texCoordIndex} )`
       );
    });
  };
};

const modelUrl = '//cdn.wtlstudio.com/sample.wtlstudio.com/1a77417f-b6ff-467f-8cf7-69be4568c1e9.glb';

const createWorld = () => {
  new GLTFLoader().load(modelUrl, gltf => {
    const mesh = gltf.scene;
    mesh.traverse(child => {
      if (!child.material) {
        return;
      }

      console.log(mesh);
      
      remapMaterialUVs(child.material, {
        'map': 'texcoord_2',
        'emissiveMap': 'texcoord_2'
      });
      child.castShadow = true;
    });

    mesh.position.x -= 3.0;

    setInterval(() => {
      mesh.rotateX(0.001);
      mesh.rotateY(0.001);
    }, 1/60);
    
    scene.add(mesh);
  });
  
  new GLTFLoader().load(modelUrl, gltf => {
    const mesh = gltf.scene;
    mesh.traverse(child => {
      if (!child.material) {
        return;
      }
      
      remapMaterialUVs(child.material, {
        'emissiveMap': 'texcoord_3'
      });
      
      child.castShadow = true;
    });
    mesh.position.x += 3.0;
    
    scene.add(mesh);
    camera.lookAt(mesh.position);
    
    setInterval(() => {
      mesh.rotateX(0.001);
      mesh.rotateY(0.001);
    }, 1/60);
  });
  
  ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(15.0, 15.0, 15.0),
    new THREE.MeshStandardMaterial({ color: 0xffffcc })
  );
  ground.rotation.x = -Math.PI / 2.0;
  ground.position.y = -2.0;
  ground.receiveShadow = true;

  lightPrimary = new THREE.PointLight(0xffffff, 0.1, 20.0);
  lightPrimary.position.set(2.0, 2.0, 2.0);
  lightPrimary.castShadow = true;
  
  lightSecondary = new THREE.PointLight(0xffffff, 0.1, 20.0);
  lightSecondary.position.set(-2.0, 2.0, -2.0);
  lightSecondary.castShadow = true;
  
  scene.add(ground);
  scene.add(lightPrimary);
  scene.add(lightSecondary);
};

const init = () => {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000.0);
  camera.position.set(-5, 5, 7);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);

  scene.add(new THREE.HemisphereLight(0xffffcc, 0x19bbdc, 0.1));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  
  createWorld();
}

const animate = () => {
  requestAnimationFrame(animate);
  
  controls.update();

  renderer.render(scene, camera); 
}

init();
animate();
