import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshStandardMaterial, Vector3 } from 'three'

// CANVAS
const canvas = document.querySelector('canvas.webgl')

// SCENE
const scene = new THREE.Scene()

/**************** IMPORTED MODELS ****************/
// LOAD DRACO
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');

// LOAD GLTF FILE
const loader = new GLTFLoader();
let mixer = null;   // so we can access it in the tick function, let because we will change it

let gltfPosition = new THREE.Vector3(0, 0, 0);
let model = null;   // so we can access it in the tick function, let because we will change it

loader.load(
    './models/1L-Fabric.gltf', 
    
    //load the scene
    (gltf) => {
        model = gltf.scene;
        mixer = new THREE.AnimationMixer(gltf.scene);
    
        let recline = null;
        let storage = null;
        for(let i=0; i<gltf.animations.length; i++){
            if(gltf.animations[i].name == "Recline")
                recline = i;
            if(gltf.animations[i].name == "Storage")
                storage = i;
        }

        console.log(gltf.scene);

        gltfPosition = gltf.scene.position;
        // RECLINE ANIMATION
        // const action = mixer.clipAction(gltf.animations[recline]);
        // STORAGE ANIMATION
        const action = mixer.clipAction(gltf.animations[storage]);

        action.play();

        scene.add(gltf.scene);
    }
)
loader.setDRACOLoader(dracoLoader);

/************************************************/

const material = new THREE.MeshStandardMaterial();
material.side = THREE.DoubleSide;

const materialFloor = new THREE.MeshStandardMaterial()
materialFloor.side = THREE.DoubleSide;

console.log(material);
console.log(materialFloor);

// PLANE MESH
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15,15), 
    materialFloor
)
plane.position.x = 1;
plane.rotation.x = Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
    
// ADD TO SCENE
scene.add(plane);

// SPHERE MESH
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    material
)
sphere.position.y = 0.5;
sphere.position.x = 2;
scene.add(sphere);

// RAYCASTER
const raycaster = new THREE.Raycaster();
// const rayOrigin = new THREE.Vector3(-3, 0, 0);
// const rayDirection = new THREE.Vector3(10, 0, 0);   // has to be normalized
// rayDirection.normalize();

// raycaster.set(rayOrigin, rayDirection);

// const intersect = raycaster.intersectObject(sphere);
// console.log(intersect);

// MOUSE EVENTS
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (_event) => {
    mouse.x = _event.clientX / sizes.width * 2 - 1;
    mouse.y = - (_event.clientY / sizes.height) * 2 + 1;
})

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
    width: window.innerWidth,   // viewport width
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
window.addEventListener('dblclick', () => {
    if(!document.fullscreenElement) canvas.requestFullscreen();
    document.exitFullscreen;
})

// // CURSOR COORDINATES
// const cursor = {
//     x: 0, 
//     y: 0
// }
// window.addEventListener('mousemove', (event) =>
// {
//     cursor.x = event.clientX / sizes.width - 0.5;
//     cursor.y = event.clientY / sizes.height - 0.5;
// })

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

// RENDERING EVERY TIME UNIT
const clock = new THREE.Clock() // current time
let previousTime = 0;

// RENDER FUNCTION
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    
    // raycaster & mouse
    raycaster.setFromCamera(mouse, camera); // mouse - RaycasterDirection, camera - RaycasterOrigin

    let intersected = null;
    if (model)
        intersected = raycaster.intersectObject(model);
    
    // console.log(intersected);

    if(intersected === sphere) console.log('clicked');

    // window.addEventListener('click', () => {
    //     if(intersected.object) console.log('clicked');
    // })

    // OBJECTS THAT CAN BE CHANGED
    // for(const obj of objsToTest)
    //     obj.material.color.set("#ffffff");

    // // CHANGE OBJECTS
    // for(const intersect of intersects)
    //     intersect.object.material.color.set("#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"));
        // intersect.object.material.color.set("#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"));

    // update mixer
    // we have to skip the period between the initial declaration of null and the actual declaration
    if(mixer !== null) mixer.update(deltaTime);

    controls.update();
    
    // camera.lookAt(gltfPosition);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();
