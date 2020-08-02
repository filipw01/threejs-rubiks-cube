import * as THREE from "three";
import RubiksCube from "./rubiksCube";
import "regenerator-runtime/runtime";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.x = 10;
camera.position.z = 10;
camera.rotation.y = 0.75;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cube = new RubiksCube(3, 0.1);
scene.add(cube.mesh);

const ambient = new THREE.AmbientLight(0xffffee, 0.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffee, 0.7);
sun.position.x = -10;
sun.position.y = -100;
sun.position.z = 200;
scene.add(sun);

cube.turnWall("x", 0, scene).then(() => {
  cube.turnWall("y", 2, scene).then(() => {
    cube.turnWall("z", 0, scene).then(() => {
      cube.turnWall("x", 1, scene).then(() => {
        cube.turnWall("y", 1, scene).then(() => {
          cube.turnWall("x", 2, scene).then(() => {
            cube.turnWall("z", 2, scene).then(() => {
              cube.turnWall("y", 0, scene).then(() => {
                cube.turnWall("z", 1, scene).then(() => {
                  console.log("Turning works");
                });
              });
            });
          });
        });
      });
    });
  });
});

window.addEventListener("mousemove", (e) => {
  camera.position.x = Math.cos((e.pageX / window.innerWidth) * 10) * 20;
  camera.position.z = Math.sin((e.pageX / window.innerWidth) * 10) * 20;
  camera.position.y = Math.sin((e.pageY / window.innerHeight) * 10) * 20;
  camera.lookAt(0, 0, 0);
});

const animate = function () {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();
