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
/**************** IMPORTED MODELS ****************/
// LOAD DRACO
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
// LOAD GLTF FILE
const loader = new GLTFLoader();
const textureLoader = new TextureLoader();

let mixer = null;   // so we can access it in the tick function, let because we will change it
let gltfPosition = new Vector3(0, 0, 0);

const sceneMaterials = [];

let model = null;

const resourcesPath = '../static/';

function loadModelFabric(model){
    return './models/' + model + '-Fabric.gltf';
    // return `${resourcesPath}models/${model}-Fabric.gltf`;
}
    
const modelsList = ['1L', '2L', '3L', '4L', '5L', '6L', '7L', '8L', '9L'];
const materialsList = ['Alfresco_Brandy_seamless_icon.webp', 'Alfresco_Caviar_seamless_icon.webp', 'Alfresco_Fudge_seamless_icon.webp', 'Alfresco_Sepia_seamless_icon.webp', 'Alfresco_Shadow_seamless_icon.webp', 'Appaloosa-Denim-icon.webp', 'Appaloosa-Mustard-icon.webp'];

let materialsHTML = document.querySelector('.materialsButton');
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
        const action = mixer.clipAction(gltf.animations[recline]);
        // STORAGE ANIMATION
        // const action = mixer.clipAction(gltf.animations[storage]);
        action.play();

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

function updateMap(material, map){
    material.map = map;
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
updateMap(mainMaterial, mainTexture);

for(mat of mainMaterials)
    console.log(mat.name)

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

// SIZES
const sizes = {
    width: window.innerWidth,   // viewport width
    height: window.innerHeight  // viewport heigth
}

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