import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CubeTextureLoader, TextureLoader, Vector3 } from 'three'

// CANVAS
const canvas = document.querySelector('canvas.webgl')
// SCENE
const scene = new THREE.Scene()

// LOAD DRACO
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
// LOAD GLTF FILE
const loader = new GLTFLoader();
const textureLoader = new TextureLoader();

let mixer = null;   // so we can access it in the tick function, let because we will change it
let gltfPosition = new Vector3(0, 0, 0);

// ENVIRONMENT MAP
const cubeTextureLoader = new CubeTextureLoader();
const envTexture = cubeTextureLoader.load([
    './hdri/cubeMap/px.png',
    './hdri/cubeMap/nx.png',
    './hdri/cubeMap/py.png',
    './hdri/cubeMap/ny.png',
    './hdri/cubeMap/pz.png',
    './hdri/cubeMap/nz.png'
])

const sceneMaterials = [];

let model = null;

const resourcesPath = '../static/';

function loadModelFabric(model){
    return './models/' + model + '-Fabric.gltf';
    // return `${resourcesPath}models/${model}-Fabric.gltf`;
}

    
const modelsList = ['1L', '2L', '3L', '4L', '5L', '6L', '7L', '8L', '9L'];
const materialsList = ['Alfresco_Brandy_seamless_icon.webp', 'Alfresco_Caviar_seamless_icon.webp', 'Alfresco_Fudge_seamless_icon.webp', 'Alfresco_Sepia_seamless_icon.webp', 'Alfresco_Shadow_seamless_icon.webp', 'Appaloosa-Denim-icon.webp', 'Appaloosa-Mustard-icon.webp'];

const mainMaterials = [];

loader.load(
    loadModelFabric('2L'),

    //load the scene
    (gltf) => {
        model = gltf.scene;
        // console.log(model);
        
        // FIRST UV SET
        let uv1 = model.getObjectByName('foot_rest_low').geometry.attributes.uv.array;
        // SECOND UV SET
        let uv2 = model.getObjectByName('foot_rest_low').geometry.attributes.uv2.array;

        mixer = new THREE.AnimationMixer(gltf.scene);
        let recline = null;
        let storage = null;
        for(let i=0; i<gltf.animations.length; i++){
            if(gltf.animations[i].name == "Recline")
                recline = i;
            if(gltf.animations[i].name == "Storage")
                storage = i;
        }
        gltfPosition = gltf.scene.position;

        // RECLINE ANIMATION
        const actionRecline = mixer.clipAction(gltf.animations[recline]);
        // ON
        const reclineOn = document.querySelector('.reclineOn');
        reclineOn.addEventListener('click', () => {
            actionRecline.setLoop(THREE.LoopOnce);
            actionRecline.timeScale = 1;
            actionRecline.clampWhenFinished = true
            actionRecline.reset();
            actionRecline.play();
        })
        // OFF
        const reclineOff = document.querySelector('.reclineOff');
        reclineOff.addEventListener('click', () => {
            // actionRecline.reset();
            actionRecline.paused = false;
            actionRecline.timeScale = -1;
            // actionRecline.clampWhenFinished = true
            actionRecline.setLoop(THREE.LoopOnce);
            actionRecline.play();
        })

        // STORAGE ANIMATION
        const actionStorage = mixer.clipAction(gltf.animations[storage]);
        // ON
        const storageOn = document.querySelector('.storageOn');
        storageOn.addEventListener('click', () => {
            actionStorage.setLoop(THREE.LoopOnce);
            actionStorage.timeScale = 1;
            actionStorage.clampWhenFinished = true
            actionStorage.reset();
            actionStorage.play();
        })
        // OFF
        const storageOff = document.querySelector('.storageOff');
        storageOff.addEventListener('click', () => {
            // actionRecline.reset();
            actionStorage.paused = false;
            actionStorage.timeScale = -1;
            // actionRecline.clampWhenFinished = true
            actionStorage.setLoop(THREE.LoopOnce);
            actionStorage.play();
        })

        scene.add(model);

        // CAST SHADOW
        model.traverse(node => {
            if(node.isMesh) node.castShadow = true;
            node.envMap = envTexture;
            node.envMapIntensity = 15;
        })

        // SCENE MATERIALS 
        gltf.scene.traverse( function( object ) {
            if (object.material){ 
                sceneMaterials.push(object.material);   // ALL SCENE MATERIALS
                if(mainMaterialsList.includes(object.material.name))
                    mainMaterials.push(object.material);    // ALL MAIN MATERIALS
            }
        });
    }
)

function updateMap(material, texture){
    material.map = texture;
    material.needsUpdate = true;
}
function loadTexture(textureName){
     textureLoader.load('./textures/materials/'+textureName.toString(), result => {
        mainMaterials.forEach(mat => updateMap(mat, result))
    });
}

const mainMaterialsList = ['main', 'arm', 'back', 'back_pillow', 'seat_cushion'];
const mainTexture = textureLoader.load();   // TO BE UPLOADED
const mainMaterial = new THREE.MeshStandardMaterial();
console.log(mainMaterial)
updateMap(mainMaterial, mainTexture);

mainMaterial

// for(mat of mainMaterials)
    // console.log(mat.name)

// CREATE HTML ELEMENTS
let materialsHTML = document.querySelector('.covers');

materialsList.forEach((item) => {
    let matDiv = document.createElement("img");

    matDiv.src = `./textures/materials/${item}`;
    matDiv.className = item;
    materialsHTML.appendChild(matDiv);

    matDiv.onclick = function(){
        const currentTexture = loadTexture(item.toString());
    }
})

loader.setDRACOLoader(dracoLoader);

// MATERIALS
const material = new THREE.MeshStandardMaterial()
material.side = THREE.DoubleSide;
material.envMap = envTexture;

const floorMaterial = new THREE.MeshStandardMaterial();
const floorTexture = textureLoader.load('./textures/floor_texture.png');
updateMap(floorMaterial, floorTexture);

// PLANE MESH
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15,15),
    floorMaterial
)
plane.position.x = 1;
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// LIGHTS
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add(directionalLight);
directionalLight.castShadow = true;
directionalLight.position.x = 1;
directionalLight.position.z = 2;

// SIZES
const sizes = {
    width: window.innerWidth/2,   // viewport width
    height: window.innerHeight  // viewport heigth
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
// FULLSCREEN ON DOUBLE CLICK, ESC TO EXIT
// window.addEventListener('dblclick', () => {
//     if(!document.fullscreenElement) canvas.requestFullscreen();
//     document.exitFullscreen;
// })
// CURSOR COORDINATES
const cursor = {
    x: 0,
    y: 0
}
window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width - 0.5;
    cursor.y = event.clientY / sizes.height - 0.5;
    //console.log(cursor.x);
})

// CAMERA
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 3;   // closer
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
// LIMITING THE ROTATION OF CAMERA - FROM FLOOR TO ZENITH
controls.maxPolarAngle = Math.PI / 2.5;
renderer.shadowMap.enabled = true;

const clock = new THREE.Clock() // current time
let previousTime = 0;
const render = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // update mixer
    // we have to skip the period between the initial declaration of null and the actual declaration
    if(mixer !== null) mixer.update(deltaTime);
    controls.update();
    camera.lookAt(gltfPosition);
    renderer.render(scene, camera);

    window.requestAnimationFrame(render);
}
render();