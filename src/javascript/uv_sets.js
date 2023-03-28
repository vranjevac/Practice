import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CubeTextureLoader, TextureLoader, Vector3, Vector4 } from 'three'
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js' // hdri

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/'); // static folder

const loader = new GLTFLoader();
const textureLoader = new TextureLoader();

function assignTexture(material, texture){
    material.map = texture;
    material.needsUpdate = true;
}

// ENVIRONMENT MAP
// const cubeTextureLoader = new CubeTextureLoader();
// const envTexture = cubeTextureLoader.load([
//     './hdri/cubeMap/px.png',
//     './hdri/cubeMap/nx.png',
//     './hdri/cubeMap/py.png',
//     './hdri/cubeMap/ny.png',
//     './hdri/cubeMap/pz.png',
//     './hdri/cubeMap/nz.png'
// ])
// scene.background = envTexture;

const modelMaterial = new THREE.MeshStandardMaterial();

// HDRI
const hdrURL = new URL('../../static/hdri/artist.hdr', import.meta.url);
const loaderRGBE = new RGBELoader();
loaderRGBE.load(hdrURL, texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
    scene.environment = texture;
    // modelMaterial.envMap = texture;
});

// modelMaterial.roughness = 1;

const modelNormal = textureLoader.load('./textures/fabric-pillows-Normal.jpg');
const modelAO = textureLoader.load('./textures/fabric-pillows-AO.jpg');
const modelDiffuse = textureLoader.load('./textures/materials/Basilica/Basilica-Clambake.jpg');
modelAO.flipY = false;
modelNormal.flipY = false;
modelDiffuse.flipY = false;
modelMaterial.side = THREE.DoubleSide;

modelMaterial.normalMap = modelNormal;
modelMaterial.aoMap = modelAO;
modelMaterial.aoMapIntensity = 1;
assignTexture(modelMaterial, modelDiffuse);

/********************** SHADERS **********************/
modelMaterial.onBeforeCompile = shader => {
    console.log(shader.vertexShader);

    const uv2_vertexShader = 
    `
        attribute vec2 uv2;
        varying vec2 vUv2;
    `

    // FRAGMENT SHADER
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
            #include <normal_fragment_maps>
        `
    )

    // VERTEX SHADER
    shader.vertexShader = shader.vertexShader.replace(
        '#include <uv2_pars_vertex>',
        `
            #include <uv2_pars_vertex>
        `
        // uv2_vertexShader
    )
}


// const uv2_vertexShader = 
// 	`
//         attribute vec2 uv2; 
//         varying vec2 vUv2;
// 	`
// const uv2_vertexShaderV = 
// 	`
// 		vUv2 = uv2; 
// 	`
// const uv2_fragmentShader = 
// 	`
// 		uniform sampler2D tex1; 
// 		uniform sampler2D tex2; 
// 		varying vec2 vUv2; 
// 	`
// const normal_fragmentShader = 
// 	`
// 		vec4 textureDiffuse = texture2D(tex1, vUv); 
// 		vec4 textureNormal = texture2D(tex2, vUv2);
//         // normal = texture2D( normalMap, vUv2 ).xyz * 2.0 - 1.0;
//         normal = texture2D( normalMap, vUv2 ).xyz * 2.0 - 1.0;
// 	`

// modelMaterial.onBeforeCompile = shader => {
//     console.log(shader);
//     shader.uniforms.tex1= {type: "t", value: modelDiffuse};
//     shader.uniforms.tex2= {type: "t", value: modelNormal};
    
//     shader.fragmentShader = shader.fragmentShader.replace(
//         '#include <normal_fragment_maps>',
//         normal_fragmentShader
//     );

//     shader.fragmentShader = shader.fragmentShader.replace(
//         '#include <uv2_pars_fragment>', 
//         uv2_fragmentShader
//     );

//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <uv2_pars_vertex>', 
//         uv2_vertexShader );
//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <uv2_vertex>', 
//         uv2_vertexShaderV );
    
// };

// main, back, arm, back_pillow, seat_cushion
const mainMaterialNames = ['main', 'arm', 'back', 'back_pillow', 'seat_cushion'];
const mainMaterials = [];

let model = null;
let gltfPosition = new Vector3(0, 0, 0);

loader.load(
    '../models/8L-Fabric.gltf',
    (gltf) => {
        model = gltf.scene;
        model.castShadow = true;
        gltfPosition = gltf.scene.position;

        scene.add(model);

        model.traverse(obj => {
            if(obj.isMesh) {
                // cast shadow
                obj.castShadow = true;
                // console.log(obj.geometry.attributes.uv2);

                // main materials
                for (let i = 0; i < mainMaterialNames.length; i++){
                    if(mainMaterialNames.includes(obj.material.name)){
                        mainMaterials.push(obj.material);
                        obj.material = modelMaterial
                    }
                }
            }
        })
    }
)
loader.setDRACOLoader(dracoLoader);

const floorMaterial = new THREE.MeshStandardMaterial();
floorMaterial.side = THREE.DoubleSide;
const floorTexture = textureLoader.load('./textures/floor_texture.png');
assignTexture(floorMaterial, floorTexture);

floorMaterial.side = THREE.DoubleSide;
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2,2),
    floorMaterial
)
floor.position.y = -0.07;
floor.rotation.x = Math.PI/2 ;
floor.receiveShadow = true;
scene.add(floor);








/************************************************************************/

// LIGHTS
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
// scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
// scene.add(directionalLight);
directionalLight.castShadow = true;
directionalLight.position.x = 3;
directionalLight.position.z = 8;

// RENDER
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
// RESIZING THE WINDOW
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    // update camera
    camera.aspect = sizes.width / sizes.height;
    // don't stretch the content
    camera.updateProjectionMatrix();
    // update renderer
    renderer.setSize(sizes.width, sizes.height);
})
const cursor = {
    x: 0,
    y: 0
}
window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width;
    cursor.y = event.clientY / sizes.height;
})
// CAMERA
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 1;
camera.position.y = 2;
scene.add(camera);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setClearAlpha(0);
renderer.setSize(sizes.width, sizes.height);
// LIMITING THE PIXEL RATIO TO 2
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// REALISTIC
// renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 1.8;

const clock = new THREE.Clock(); // current time
let previousTime = 0;
const render = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    controls.update();
    camera.lookAt(gltfPosition);
    renderer.render(scene, camera);

    window.requestAnimationFrame(render);
}
render();