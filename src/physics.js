import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import CANNON from 'cannon'
import { Color } from 'three'

// CANVAS
const canvas = document.querySelector('canvas.webgl')

// SCENE
const scene = new THREE.Scene()

/************** PHYSICS **************/
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

// MATERIALS
const concreteMaterial = new CANNON.Material('concrete');
const plasticMaterial = new CANNON.Material('plastic');

const concretePlasticContact = new CANNON.ContactMaterial(
    concreteMaterial,
    plasticMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)

world.addContactMaterial(concretePlasticContact);

const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({
    mass: 1, 
    position: new CANNON.Vec3(0, 3, 0),
    shape: sphereShape,
    material: plasticMaterial
})
world.addBody(sphereBody);

// FLOOR 
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
    mass: 0,     // can't be moved
    shape: floorShape,
    material: concreteMaterial
})
world.addBody(floorBody);

floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI / 2
)

/*************************************/

const material = new THREE.MeshStandardMaterial()

// SPHERE MESH
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    material
)
sphere.position.x = 1.5;
sphere.castShadow = true;

material.side = THREE.DoubleSide;
    
// PLANE MESH
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15,15), 
    material
)
plane.position.x = 1;
plane.rotation.x = Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
    
// ADD TO SCENE
scene.add(sphere, plane);

// LIGHTS
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
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
camera.position.y = 10;   // closer to sphere
camera.position.z = 5;
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
controls.maxPolarAngle = Math.PI / 2;

renderer.shadowMap.enabled = true;

// window.addEventListener('click', () => {
//     material.color = new Color("#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"));
// })

// RENDERING EVERY TIME UNIT
const clock = new THREE.Clock() // current time
let oldElapsedTime = 0;
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now
    const delta = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    world.step(1/60, delta, 3);

    /************** PHYSICS **************/
    // MANUEL POSITION COPY
    // sphere.position.x = sphereBody.position.x;
    // sphere.position.y = sphereBody.position.y;
    // sphere.position.z = sphereBody.position.z;
    sphere.position.copy(sphereBody.position);

    /*************************************/

    controls.update();
    
    // camera.lookAt(sphere.position);
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();
