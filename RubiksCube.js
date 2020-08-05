import { Group, Clock } from "three";
import Cube from "./Cube";

export default class RubiksCube {
  constructor(scene, size = 3, spaceBetween = 0.1) {
    this.scene = scene;
    this.size = size;
    this.positions = RubiksCube.generatePositions(size, spaceBetween);
    const Color = {
      DEFAULT: 0xcccccc,
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
      cubeColors[0] = Color.DEFAULT;
      cubeColors[1] = Color.DEFAULT;
      if (x === biggestPosition) {
        cubeColors[0] = Color.WHITE;
      }
      if (x === smallestPosition) {
        cubeColors[1] = Color.GREEN;
      }

      for (const y of positions) {
        cubeColors[2] = Color.DEFAULT;
        cubeColors[3] = Color.DEFAULT;
        if (y === biggestPosition) {
          cubeColors[2] = Color.ORANGE;
        }
        if (y === smallestPosition) {
          cubeColors[3] = Color.RED;
        }

        for (const z of positions) {
          cubeColors[4] = Color.DEFAULT;
          cubeColors[5] = Color.DEFAULT;
          if (z === biggestPosition) {
            cubeColors[4] = Color.BLUE;
          }
          if (z === smallestPosition) {
            cubeColors[5] = Color.YELLOW;
          }

          const cube = new Cube(x, y, z, [...cubeColors]);
          cube.mesh.origin = cube;
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
          ].origin.colors;
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
          ].origin.colors;
      }
    }
    // Apply colors after transformation
    sortedCubes.forEach((cube, index) => {
      cube.origin.colors = movedColors[index];
    });
  }

  rotateCubesColors(wall, axis, direction = 1) {
    for (const cube of wall.children) {
      const [front, back, bottom, top, left, right] = cube.origin.colors;
      let z = [front, back];
      let y = [bottom, top];
      let x = [left, right];
      if (axis === "x") {
        if (direction === 1) {
          cube.origin.colors = [...z, ...x.reverse(), ...y];
        } else cube.origin.colors = [...z, ...x, ...y.reverse()];
      } else if (axis === "y") {
        if (direction === 1) {
          cube.origin.colors = [...x.reverse(), ...y, ...z];
        } else cube.origin.colors = [...x, ...y, ...z.reverse()];
      } else if (axis === "z") {
        if (direction === 1) {
          cube.origin.colors = [...y.reverse(), ...z, ...x];
        } else cube.origin.colors = [...y, ...z.reverse(), ...x];
      }
    }
  }

  paint(axis, wall, direction = 1) {
    if (axis === "y") direction *= -1;
    this.moveCubesColors(wall, direction);
    this.rotateCubesColors(wall, axis, direction);
  }

  static randomRange(start, end) {
    if (start > end) throw new Error("Invalid range");
    const min = Math.ceil(start);
    const max = Math.floor(end);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  shuffle(numberOfTurns = 20, animate = false) {
    for (let i = 0; i < numberOfTurns; i++) {
      const randomWallNumber = RubiksCube.randomRange(0, this.size - 1);
      const randomDirection = Math.random > 0.5 ? 1 : -1;
      let randomAxis;
      switch (RubiksCube.randomRange(0, 2)) {
        case 0:
          randomAxis = "x";
          break;
        case 1:
          randomAxis = "y";
          break;
        case 2:
          randomAxis = "z";
          break;
      }
      if (animate) {
        this.queueTurn(randomAxis, randomWallNumber, randomDirection);
      } else {
        const wall = this.group(randomAxis, randomWallNumber);
        this.paint(randomAxis, wall, randomDirection);
        this.ungroup(wall);
      }
    }
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

  queueTurn(axis, wallNumber, direction = 1) {
    this.queue.push({ axis, wallNumber, direction });
    if (!this.queueRunning) {
      this.queueWaiter = new Promise(async (resolve) => {
        this.queueRunning = true;
        while (this.queue[0]) {
          const { axis, wallNumber, direction } = this.queue[0];
          await this.turnWall(axis, wallNumber, direction);
          this.queue.shift();
        }
        this.queueRunning = false;
        resolve();
      });
    }
  }
}
