import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from "three";
import RubiksCube from "./RubiksCube";
import GestureHandler from "./GestureHandler";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

const scene = new Scene();
scene.background = new Color(0xaaaaaa);
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.x = 10;
camera.position.z = 10;
camera.rotation.y = 10;
camera.lookAt(0, 0, 0);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 2;
controls.noPan = true;
controls.noZoom = true;

const cube = new RubiksCube(scene);
scene.add(cube.mesh);

const ambient = new AmbientLight(0xffffee, 0.5);
scene.add(ambient);

const sun = new DirectionalLight(0xffffee, 0.7);
scene.add(sun);

new GestureHandler(camera, renderer, cube);

// (async () => {
//   for (let index = 0; index < 6; index++) {
//     await cube.turnWall("x", 0, -1);
//     await cube.turnWall("y", 0);
//     await cube.turnWall("x", 0);
//     await cube.turnWall("y", 0, -1);
//   }
// })();

const animate = function () {
  requestAnimationFrame(animate);

  controls.update();
  sun.position.copy(camera.position);
  renderer.render(scene, camera);
};

animate();
