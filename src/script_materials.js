import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { AlphaFormat } from 'three'

// CANVAS
const canvas = document.querySelector('canvas.webgl')

// SCENE
const scene = new THREE.Scene()

const material = new THREE.MeshStandardMaterial()
// SPHERE MESH
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    material
)
sphere.position.x = 1.5;
sphere.castShadow = true;

material.side = THREE.DoubleSide;

// TORUS MESH
const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 16, 32),
    material
)
torus.castShadow = true;
    
// PLANE MESH
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15,15), 
    material
)
plane.position.x = 1;
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
plane.receiveShadow = true;
    
// ADD TO SCENE
scene.add(sphere, plane, torus);

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

// FULLSCREEN ON DOUBLE CLICK, ESC TO EXIT
window.addEventListener('dblclick', () => {
    if(!document.fullscreenElement) canvas.requestFullscreen();
    document.exitFullscreen;
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
camera.position.z = 3;   // closer to sphere
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

// RENDERING EVERY TIME UNIT
const clock = new THREE.Clock() // current time
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now
    
    controls.update();
    
    camera.lookAt(sphere.position);
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();
