import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import * as CANNON from './Cannon.js';
import * as PointerLockControls from './PointerLockControls.js';
import * as CubeTexture from 'https://unpkg.com/three@0.77.0/src/textures/CubeTexture.js';

let sphereShape, sphereBody, world, physicsMaterial, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[];
let camera, scene, renderer;
let geometry, material, mesh;
let controls,time = Date.now();
let blocker = document.getElementById( 'blocker' );
let instructions = document.getElementById( 'instructions' );
let havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
let i;
let INTERSECTED;
let raycaster;
let pointer = new THREE.Vector2();
raycaster = new THREE.Raycaster();

if ( havePointerLock ) {

	let element = document.body;
	let pointerlockchange = function ( event ) {
		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

      	controls.enabled = true;
         blocker.style.display = 'none';

		} else {

      	controls.enabled = false;
         blocker.style.display = '-webkit-box';
         blocker.style.display = '-moz-box';
         blocker.style.display = 'box';
         instructions.style.display = '';

      }
   }


let pointerlockerror = function ( event ) {
	instructions.style.display = '';
}


// Hook pointer lock state change events
document.addEventListener( 'pointerlockchange', pointerlockchange, false );
document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

document.addEventListener( 'pointerlockerror', pointerlockerror, false );
document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

instructions.addEventListener( 'click', function ( event ) {

	instructions.style.display = 'none';
   // Ask the browser to lock the pointer
   element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
   if ( /Firefox/i.test( navigator.userAgent ) ) {
      let fullscreenchange = function ( event ) {
      	if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
				document.removeEventListener( 'fullscreenchange', fullscreenchange );
            document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
            element.requestPointerLock();
			}
      }
      document.addEventListener( 'fullscreenchange', fullscreenchange, false );
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
		element.requestFullscreen();
	} else {
	element.requestPointerLock();
	}
}, false );

} else {
instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

            
initCannon();
init();
animate();

            
function initCannon() {
	// Setup our world
   world = new CANNON.World();
   world.quatNormalizeSkip = 0;
   world.quatNormalizeFast = false;

	let solver = new CANNON.GSSolver();

   world.defaultContactMaterial.contactEquationStiffness = 1e9;
   world.defaultContactMaterial.contactEquationRelaxation = 4;

   solver.iterations = 7;
   solver.tolerance = 0.1;
   let split = true;
   if(split)
      world.solver = new CANNON.SplitSolver(solver);
      else
      world.solver = solver;

   world.gravity.set(0,-20,0);
   world.broadphase = new CANNON.NaiveBroadphase();

   // Create a slippery material (friction coefficient = 0.0)
   physicsMaterial = new CANNON.Material("slipperyMaterial");
   let physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
                                                                        physicsMaterial,
                                                                        0.0, // friction coefficient
                                                                        0.3  // restitution
                                                                        );
   // We must add the contact materials to the world
   world.addContactMaterial(physicsContactMaterial);

   // Create a sphere
   let mass = 5, radius = 1.3;
   sphereShape = new CANNON.Sphere(radius);
   sphereBody = new CANNON.Body({ mass: mass });
   sphereBody.addShape(sphereShape);
   sphereBody.position.set(0,5,0);
   sphereBody.linearDamping = 0.9;
   world.add(sphereBody);

   // Create a plane
   let groundShape = new CANNON.Plane();
   let groundBody = new CANNON.Body({ mass: 0 });
   groundBody.addShape(groundShape);
   groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
   world.add(groundBody);
}



function init() {

	// Camera, Scene and Renderer
   renderer = new THREE.WebGLRenderer();
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = THREE.PCFShadowMap;
   renderer.setSize( window.innerWidth, window.innerHeight );
   document.body.appendChild( renderer.domElement );
					 
   camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

   scene = new THREE.Scene();
	scene.background = new THREE.Color("white");
	scene.fog = new THREE.Fog( "white", 0, 10 );

	// Lights
	let light1 = new THREE.PointLight("white", 500);
	light1.position.set(5, 7, 5);
	light1.castShadow = true;
	light1.shadow.camera.near = 2.5;
   scene.add(light1);

	let light2 = new THREE.AmbientLight("white", 2);
	light2.position.set(10, 2, 0);
	scene.add(light2);


	// Controls
   controls = new PointerLockControls( camera , sphereBody );
   scene.add( controls.getObject() );


   // Floor
   let planeGeometry = new THREE.PlaneGeometry(300, 300);
   let planeMaterial = new THREE.MeshPhongMaterial({ color: "green", wireframe: false });
	let plane = new THREE.Mesh(planeGeometry, planeMaterial);
   plane.receiveShadow = true;
	plane.rotation.x -= Math.PI / 2;
   scene.add(plane);


   window.addEventListener( 'resize', onWindowResize, false );

	// Add Walls
	let BoxMesh;
	let BoxGeometry;
	let BoxMaterial;
	let BoxX;
	let BoxY;
	let BoxZ;
	let BoxSize;
	let BoxShape;
	let BoxBody;
	

	// Object:Box - CANNON
	BoxX = 0;
	BoxY = 2;
	BoxZ = 0;
	BoxSize = new CANNON.Vec3(2, 2, 2);
	BoxShape = new CANNON.Box(BoxSize);
	BoxBody = new CANNON.Body({ mass: 1000 });
	BoxBody.addShape(BoxShape);

	world.add(BoxBody);

	BoxBody.position.set(BoxX, BoxY,0);
	boxes.push(BoxBody);


	// Object:Box - THREE
	const loader = new THREE.CubeTextureLoader();

	const textureCube = loader.load( [
		'crate.jpg', 'crate.jpg',
		'crate.jpg', 'crate.jpg',
		'crate.jpg', 'crate.jpg'
	] );
	
	BoxGeometry = new THREE.BoxGeometry(BoxSize.x*2, BoxSize.y*2, BoxSize.z*2);
	BoxMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff, envMap: textureCube } );
	BoxMesh = new THREE.Mesh(BoxGeometry, BoxMaterial);
	BoxMesh.receiveShadow = true;
	BoxMesh.castShadow = true;

	scene.add(BoxMesh);

	BoxMesh.position.set(10,0,0);
	boxMeshes.push(BoxMesh);

}


            
function onWindowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize( window.innerWidth, window.innerHeight );
}

let dt = 1/60;
				
function animate() {
   requestAnimationFrame( animate );
   if(controls.enabled){
   	world.step(dt);

   	// Update box positions
   	for(i=0; i<boxes.length; i++){
      	boxMeshes[i].position.copy(boxes[i].position);
      	boxMeshes[i].quaternion.copy(boxes[i].quaternion);

		}

	}


	controls.update( Date.now() - time );
	renderer.render( scene, camera );
	time = Date.now();
}

window.addEventListener("click",function(e){

	pointer.x = 0;
	pointer.y = - 0;

	raycaster.setFromCamera( pointer, camera, );
	raycaster.far = 5;

	const intersects = raycaster.intersectObjects( scene.children, false );

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				INTERSECTED = intersects[ 0 ].object;
				console.log(INTERSECTED);
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex( 0x00ff00 );
		}
	} else {
		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		INTERSECTED = null;
	}

});
