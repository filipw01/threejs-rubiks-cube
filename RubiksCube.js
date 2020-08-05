import { Group, Clock } from "three";
import Cube from "./Cube";

export default class RubiksCube {
  constructor(scene, size = 3, spaceBetween = 0.1) {
    this.scene = scene;
    this.size = size;
    this.positions = RubiksCube.generatePositions(size, spaceBetween);
    const Color = {
      GREEN: 0x009b48,
      YELLOW: 0xffd500,
      BLUE: 0x0045ad,
      RED: 0xcc0000,
      WHITE: 0xffffff,
      ORANGE: 0xff5900,
    };
    this.mesh = RubiksCube.generateCubes(this.positions, Color);
    this.queue = [];
  }

  static generatePositions(size, spaceBetween) {
    const positions = [];
    for (let index = 0; index < size; index++) {
      const position = (index - (size - 1) / 2) * (2 + spaceBetween);
      positions.push(position);
    }
    return positions;
  }

  static generateCubes(positions, Color) {
    const mesh = new Group();
    const cubeColors = [];
    const smallestPosition = positions[0];
    const biggestPosition = positions[positions.length - 1];

    // Generate 3D colored cubes for Rubik's cube
    for (const x of positions) {
      cubeColors[0] = null;
      cubeColors[1] = null;
      if (x === biggestPosition) {
        cubeColors[0] = Color.WHITE;
      } else if (x === smallestPosition) {
        cubeColors[1] = Color.GREEN;
      }

      for (const y of positions) {
        cubeColors[2] = null;
        cubeColors[3] = null;
        if (y === biggestPosition) {
          cubeColors[2] = Color.ORANGE;
        } else if (y === smallestPosition) {
          cubeColors[3] = Color.RED;
        }

        for (const z of positions) {
          cubeColors[4] = null;
          cubeColors[5] = null;
          if (z === biggestPosition) {
            cubeColors[4] = Color.BLUE;
          } else if (z === smallestPosition) {
            cubeColors[5] = Color.YELLOW;
          }

          const cube = new Cube(x, y, z, [...cubeColors]);
          cube.mesh.customParent = cube;
          mesh.add(cube.mesh);
        }
      }
    }
    return mesh;
  }

  group(axis, wallIndex) {
    const group = new Group();
    this.mesh.children
      .filter((cube) => cube.position[axis] === this.positions[wallIndex])
      .forEach((cube) => {
        group.add(cube);
      });
    this.scene.add(group);
    return group;
  }

  ungroup(wall) {
    while (wall.children[0]) {
      this.mesh.add(wall.children[0]);
    }
    this.scene.remove(wall);
  }

  moveCubesColors(wall, direction = 1) {
    const movedColors = [];
    const sortedCubes = wall.children.sort(
      (a, b) =>
        a.position.x - b.position.x ||
        a.position.y - b.position.y ||
        a.position.z - b.position.z
    );
    if (direction === 1) {
      // Transform to turn counterclockwise
      for (let i = 0; i < sortedCubes.length; i++) {
        movedColors[i] =
          sortedCubes[
            i +
              (this.size - 1) * (i + 1) -
              Math.floor(i / this.size) * (this.size * this.size + 1)
          ].customParent.colors;
      }
    } else {
      for (let i = 0; i < sortedCubes.length; i++) {
        // Transform to turn clockwise
        movedColors[i] =
          sortedCubes[
            i +
              this.size * (this.size - 1) -
              (this.size + 1) * i +
              Math.floor(i / this.size) * (this.size * this.size + 1)
          ].customParent.colors;
      }
    }
    // Apply colors after transformation
    sortedCubes.forEach((cube, index) => {
      cube.customParent.colors = movedColors[index];
    });
  }

  rotateCubesColors(wall, axis, direction = 1) {
    for (const cube of wall.children) {
      const [front, back, bottom, top, left, right] = cube.customParent.colors;
      let z = [front, back];
      let y = [bottom, top];
      let x = [left, right];
      if (axis === "x") {
        if (direction === 1) {
          cube.customParent.colors = [...z, ...x.reverse(), ...y];
        } else cube.customParent.colors = [...z, ...x, ...y.reverse()];
      } else if (axis === "y") {
        if (direction === 1) {
          cube.customParent.colors = [...x.reverse(), ...y, ...z];
        } else cube.customParent.colors = [...x, ...y, ...z.reverse()];
      } else if (axis === "z") {
        if (direction === 1) {
          cube.customParent.colors = [...y.reverse(), ...z, ...x];
        } else cube.customParent.colors = [...y, ...z.reverse(), ...x];
      }
    }
  }

  paint(axis, wall, direction = 1) {
    if (axis === "y") direction *= -1;
    this.moveCubesColors(wall, direction);
    this.rotateCubesColors(wall, axis, direction);
  }

  async turnWall(axis, wallNumber, direction = 1) {
    const wall = this.group(axis, wallNumber);
    const clock = new Clock(true);
    const time = 0.3;
    let animationFrame;
    const ungroup = this.ungroup.bind(this);
    const paint = this.paint.bind(this);

    return new Promise((resolve) => {
      function animate() {
        const ease = 1 - Math.pow(1 - clock.getElapsedTime() / time, 2);
        for (const cubeMesh of wall.children) {
          cubeMesh.morphTargetInfluences[0] = Math.abs(
            Math.sin(ease * Math.PI)
          );
        }
        wall.rotation[axis] = (Math.PI / 2) * ease * direction;

        animationFrame = requestAnimationFrame(animate);

        if (clock.getElapsedTime() >= 1 * time) {
          for (const cubeMesh of wall.children) {
            cubeMesh.morphTargetInfluences[0] = Math.abs(Math.sin(Math.PI));
          }
          wall.rotation[axis] = (Math.PI / 2) * direction;
          paint(axis, wall, direction);
          ungroup(wall);
          resolve();
          cancelAnimationFrame(animationFrame);
        }
      }
      animate();
    });
  }

  async queueTurn(axis, wallNumber, direction = 1) {
    this.queue.push({ axis, wallNumber, direction });
    if (!this.queueRunning) {
      this.queueRunning = true;
      while (this.queue[0]) {
        const { axis, wallNumber, direction } = this.queue[0];
        await this.turnWall(axis, wallNumber, direction);
        this.queue.shift();
      }
      this.queueRunning = false;
    }
  }
}
