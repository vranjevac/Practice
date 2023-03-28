import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { RepeatWrapping } from 'three';

// DEBUG INIT
const gui = new dat.GUI();

// CANVAS
const canvas = document.querySelector('canvas.webgl')

// SCENE
const scene = new THREE.Scene()

// LOAD IMAGE
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('minecraft.png');

// REPEATING THE TEXTURE ALONG U AXIS
texture.repeat.x = 1;
texture.wrapS = THREE.RepeatWrapping;

// OBJECTS
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ map: texture })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

/***********************************/
// DEBUG
gui.add(mesh.position, 'x').min(-2).max(2).step(0.01).name('translate x');
gui.add(mesh.position, 'y').min(-2).max(2).step(0.01).name('translate y');
gui.add(mesh.position, 'z').min(-2).max(2).step(0.01).name('translate z');
gui.add(mesh, 'visible');
gui.add(mesh.material, 'wireframe');

const parameters = {    
    color: material.color,
    spin: () => gsap.to(mesh.rotation, {duration: 2, y: mesh.rotation.y + Math.PI * 2})
}
gui.addColor(parameters, 'color').onChange(() => material.color.set(parameters.color));
gui.add(parameters, 'spin').name('wheeeeeeee');

/***********************************/

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3   // closer
scene.add(camera)

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height);

// LIMITING THE PIXEL RATIO TO 2
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


// LIMITING THE ROTATION OF CAMERA - FROM FLOOR TO ZENITH
controls.maxPolarAngle = Math.PI / 2;

// RENDERING EVERY TIME UNIT
const clock = new THREE.Clock() // current time
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()  // from current time to now

    controls.update();

    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();
