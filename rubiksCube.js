import { Group, Clock } from "three";
import Cube from "./cube";

export default class RubiksCube {
  constructor(size = 3, spaceBetween = 0.1) {
    this.size = size;
    this.mesh = new Group();
    this.dimensions = [];
    const colorEnum = {
      green: 0x009b48,
      yellow: 0xffd500,
      blue: 0x0045ad,
      red: 0xcc0000,
      white: 0xffffff,
      orange: 0xff5900,
    };
    this.colors = [];
    for (let index = 0; index < size; index++) {
      const position = (index - (size - 1) / 2) * (2 + spaceBetween);
      this.dimensions.push(position);
    }
    for (const x of this.dimensions) {
      const color = [];
      color[0] = null;
      color[1] = null;
      if (x === this.dimensions[0]) {
        color[1] = colorEnum.green;
      }
      if (x === this.dimensions[this.dimensions.length - 1]) {
        color[0] = colorEnum.white;
      }
      for (const y of this.dimensions) {
        color[3] = null;
        color[2] = null;
        if (y === this.dimensions[0]) {
          color[3] = colorEnum.red;
        }
        if (y === this.dimensions[this.dimensions.length - 1]) {
          color[2] = colorEnum.orange;
        }
        for (const z of this.dimensions) {
          color[4] = null;
          color[5] = null;
          if (z === this.dimensions[0]) {
            color[5] = colorEnum.yellow;
          }
          if (z === this.dimensions[this.dimensions.length - 1]) {
            color[4] = colorEnum.blue;
          }
          const cube = new Cube(x, y, z, Array.from(color));
          cube.mesh.customParent = cube;
          this.mesh.add(cube.mesh);
        }
      }
    }
  }
  group(wallAxis, wallNumber, scene) {
    const group = new Group();
    this.mesh.children
      .filter((cube) => cube.position[wallAxis] === this.dimensions[wallNumber])
      .forEach((cube) => {
        group.add(cube);
      });
    scene.add(group);
    return group;
  }
  ungroup(wall, scene) {
    while (wall.children[0]) {
      this.mesh.add(wall.children[0]);
    }
    scene.remove(wall);
  }
  moveCubesInWall(wall, direction = 1) {
    const movedColors = [];
    const sortedWallChildren = wall.children.sort(
      (a, b) =>
        a.position.x - b.position.x ||
        a.position.y - b.position.y ||
        a.position.z - b.position.z
    );
    if (direction === 1) {
      // Turn left
      for (let i = 0; i < sortedWallChildren.length; i++) {
        movedColors[i] =
          sortedWallChildren[
            i +
              (this.size - 1) * (i + 1) -
              Math.floor(i / this.size) * (this.size * this.size + 1)
          ].customParent.colors;
      }
    } else {
      for (let i = 0; i < sortedWallChildren.length; i++) {
        // Turn right
        movedColors[i] =
          sortedWallChildren[
            this.size * (this.size - 1) -
              (this.size + 1) * i +
              Math.floor(i / this.size) *
                (this.size + 1 + this.size * (this.size - 1)) +
              i
          ].customParent.colors;
      }
    }
    sortedWallChildren.forEach((cube, index) => {
      cube.customParent.colors = movedColors[index];
    });
  }
  rotateCubesInWall(wall, wallAxis, direction = 1) {
    switch (wallAxis) {
      case "x":
        if (direction === 1) {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [front, back, right, left, bottom, top];
          }
        } else {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [front, back, left, right, top, bottom];
          }
        }
        break;

      case "y":
        if (direction === 1) {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [right, left, bottom, top, front, back];
          }
        } else {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [left, right, bottom, top, back, front];
          }
        }
        break;

      case "z":
        if (direction === 1) {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [top, bottom, front, back, left, right];
          }
        } else {
          for (const cube of wall.children) {
            const [
              front,
              back,
              bottom,
              top,
              left,
              right,
            ] = cube.customParent.colors;
            cube.customParent.colors = [bottom, top, back, front, left, right];
          }
        }
        break;

      default:
        break;
    }
  }
  paint(wallAxis, wall, direction = 1) {
    if (wallAxis === "y") direction *= -1;
    this.moveCubesInWall(wall, direction);
    this.rotateCubesInWall(wall, wallAxis, direction);
  }
  async turnWall(wallAxis, wallNumber, scene, direction = 1) {
    const wall = this.group(wallAxis, wallNumber, scene);
    const clock = new Clock(true);
    const time = 0.3;
    let animationFrame;
    const ungroup = this.ungroup.bind(this, wall, scene);
    const paint = this.paint.bind(this);
    return new Promise((resolve) => {
      function animate() {
        const ease = 1 - Math.pow(1 - clock.getElapsedTime() / time, 2);
        for (const cubeMesh of wall.children) {
          cubeMesh.morphTargetInfluences[0] = Math.abs(
            Math.sin(ease * Math.PI)
          );
        }
        wall.rotation[wallAxis] = (Math.PI / 2) * ease * direction;

        animationFrame = requestAnimationFrame(animate);
        if (clock.getElapsedTime() >= 1 * time) {
          for (const cubeMesh of wall.children) {
            cubeMesh.morphTargetInfluences[0] = Math.abs(Math.sin(Math.PI));
          }
          wall.rotation[wallAxis] = (Math.PI / 2) * direction;
          paint(wallAxis, wall, direction);
          ungroup();
          resolve();
          cancelAnimationFrame(animationFrame);
        }
      }
      animate();
    });
  }
}
