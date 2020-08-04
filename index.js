import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import RubiksCube from "./rubiksCube";
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

const raycaster = new Raycaster();

const controls = new TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 2;

const cube = new RubiksCube(3, 0.1);
scene.add(cube.mesh);

const ambient = new AmbientLight(0xffffee, 0.5);
scene.add(ambient);

const sun = new DirectionalLight(0xffffee, 0.7);
scene.add(sun);

const initialMouse = {};
let deltaNeighbors;
window.addEventListener(
  "mousedown",
  () => {
    const mouse = new Vector2(-1, -1);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cube.mesh.children);
    let unlockedAxis;
    let lockedAxisIndex;
    let lockedAxis;
    if (intersects[0]) {
      event.stopPropagation();
      initialMouse.x = event.clientX;
      initialMouse.y = event.clientY;
      const { x, y, z } = intersects[0].face.normal;
      if (x !== 0) {
        lockedAxis = "x";
        lockedAxisIndex = x;
        unlockedAxis = ["y", "z"];
      } else if (y !== 0) {
        lockedAxis = "y";
        lockedAxisIndex = y;
        unlockedAxis = ["x", "z"];
      } else if (z !== 0) {
        lockedAxis = "z";
        lockedAxisIndex = z;
        unlockedAxis = ["x", "y"];
      }
      const neighbors = [
        intersects[0].object.position.clone(),
        intersects[0].object.position.clone(),
      ];

      unlockedAxis.forEach((axis, index) => {
        if (intersects[0].object.position[axis] === cube.dimensions[0]) {
          neighbors[index][axis] = cube.dimensions[1];
          neighbors[index].wallNumber = 0;
        } else {
          const dimensionIndex = cube.dimensions.findIndex(
            (dimension) => dimension === intersects[0].object.position[axis]
          );
          neighbors[index][axis] = cube.dimensions[dimensionIndex - 1];
          neighbors[index].wallNumber = dimensionIndex;
        }
        neighbors[index].axis = axis;
      });

      const canvas = renderer.domElement;
      deltaNeighbors = neighbors.map((neighbor) => {
        neighbor.project(camera);
        const { x, y, axis, wallNumber } = neighbor;
        const neighbor2D = {
          x: Math.round(((x + 1) * canvas.width) / 2),
          y: Math.round(((-y + 1) * canvas.height) / 2),
        };
        const theOtherAxis =
          unlockedAxis[0] === axis ? unlockedAxis[1] : unlockedAxis[0];
        return {
          x: initialMouse.x - neighbor2D.x,
          y: initialMouse.y - neighbor2D.y,
          axis,
          wallNumber,
          lockedAxis,
          lockedAxisIndex,
          reverseDirection: intersects[0].object.position[theOtherAxis] >= 0,
        };
      });
    }
  },
  {
    capture: true,
  }
);
let rotateAxis;
let rotateWallNumber;
let rotateDirection = 1;
window.addEventListener("mousemove", (event) => {
  if (initialMouse.x) {
    const delta = {
      x: initialMouse.x - event.clientX,
      y: initialMouse.y - event.clientY,
    };
    const offset = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
    if (offset > 5 && !rotateAxis) {
      const initialDistances = [
        Math.sqrt(
          Math.pow(deltaNeighbors[0].x, 2) + Math.pow(deltaNeighbors[0].y, 2)
        ),
        Math.sqrt(
          Math.pow(deltaNeighbors[1].x, 2) + Math.pow(deltaNeighbors[1].y, 2)
        ),
      ];
      const currentDistances = [
        Math.sqrt(
          Math.pow(deltaNeighbors[0].x - delta.x, 2) +
            Math.pow(deltaNeighbors[0].y - delta.y, 2)
        ),
        Math.sqrt(
          Math.pow(deltaNeighbors[1].x - delta.x, 2) +
            Math.pow(deltaNeighbors[1].y - delta.y, 2)
        ),
      ];
      const deltaDistances = [
        Math.abs(initialDistances[0] - currentDistances[0]),
        Math.abs(initialDistances[1] - currentDistances[1]),
      ];
      const lockedAxisIndex = deltaNeighbors[0].lockedAxisIndex;
      const lockedAxis = deltaNeighbors[0].lockedAxis;
      if (deltaDistances[0] > deltaDistances[1]) {
        rotateAxis = deltaNeighbors[1].axis;
        rotateWallNumber = deltaNeighbors[1].wallNumber;
        rotateDirection = 1;

        if (
          (lockedAxisIndex === 1 && lockedAxis === "x" && rotateAxis === "y") ||
          (lockedAxisIndex === 1 && lockedAxis === "y" && rotateAxis === "z") ||
          (lockedAxisIndex === 1 && lockedAxis === "z" && rotateAxis === "x") ||
          (lockedAxisIndex === -1 &&
            lockedAxis === "x" &&
            rotateAxis === "z") ||
          (lockedAxisIndex === -1 && lockedAxis === "y" && rotateAxis === "") ||
          (lockedAxisIndex === -1 && lockedAxis === "z" && rotateAxis === "y")
        ) {
          rotateDirection *= -1;
        }

        if (initialDistances[0] - currentDistances[0] < 0) {
          rotateDirection *= -1;
        }
        if (deltaNeighbors[1].reverseDirection) {
          rotateDirection *= -1;
        }
      } else {
        rotateAxis = deltaNeighbors[0].axis;
        rotateWallNumber = deltaNeighbors[0].wallNumber;
        rotateDirection = 1;

        if (
          (lockedAxisIndex === 1 && lockedAxis === "x" && rotateAxis === "y") ||
          (lockedAxisIndex === 1 && lockedAxis === "y" && rotateAxis === "z") ||
          (lockedAxisIndex === 1 && lockedAxis === "z" && rotateAxis === "x") ||
          (lockedAxisIndex === -1 &&
            lockedAxis === "x" &&
            rotateAxis === "z") ||
          (lockedAxisIndex === -1 &&
            lockedAxis === "y" &&
            rotateAxis === "x") ||
          (lockedAxisIndex === -1 && lockedAxis === "z" && rotateAxis === "y")
        ) {
          rotateDirection *= -1;
        }

        if (initialDistances[1] - currentDistances[1] < 0) {
          rotateDirection *= -1;
        }
        if (deltaNeighbors[0].reverseDirection) {
          rotateDirection *= -1;
        }
      }
    }
  }
});
window.addEventListener("mouseup", () => {
  cube.turnWall(rotateAxis, rotateWallNumber, scene, rotateDirection);
  rotateAxis = undefined;
  delete initialMouse.x;
  delete initialMouse.y;
});
// (async () => {
//   for (let index = 0; index < 6; index++) {
//     await cube.turnWall("x", 0, scene, -1);
//     await cube.turnWall("y", 0, scene);
//     await cube.turnWall("x", 0, scene);
//     await cube.turnWall("y", 0, scene, -1);
//   }
// })();

const animate = function () {
  requestAnimationFrame(animate);

  controls.update();
  sun.position.copy(camera.position);
  renderer.render(scene, camera);
};

animate();
