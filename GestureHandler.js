import { Vector2, Raycaster } from "three";
const raycaster = new Raycaster();

export default class GestureHandler {
  constructor(camera, renderer, cube) {
    this.isIntersecting = false;
    this.initialMouse;
    this.camera = camera;
    this.renderer = renderer;
    this.cube = cube;
    this.neighbors;
    this.rotateAxis;
    this.rotateWallNumber;
    this.rotateDirection = 1;
    document.addEventListener("pointerdown", this.mouseDownHandler.bind(this), {
      capture: true,
    });
    document.addEventListener("pointermove", this.mouseMoveHandler.bind(this));
    document.addEventListener("pointerup", this.mouseUpHandler.bind(this));
    document.addEventListener("touchstart", this.mouseDownHandler.bind(this), {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", this.mouseMoveHandler.bind(this), {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchend", this.mouseUpHandler.bind(this));
  }

  static calculateLockedAxis(faceAxises) {
    let lockedAxis, lockedAxisIndex;
    for (const [axis, axisIndex] of Object.entries(faceAxises)) {
      if (axisIndex !== 0) {
        lockedAxis = axis;
        lockedAxisIndex = axisIndex;
      }
    }
    return [lockedAxis, lockedAxisIndex];
  }

  static calculateUnlockedAxis(lockedAxis) {
    return ["x", "y", "z"].filter((axis) => axis !== lockedAxis);
  }

  getRotateDirection(neighbor, deltaDistance) {
    const { axis: rotateAxis, reverseDirection } = neighbor;
    const { lockedAxis, lockedAxisIndex } = this;
    let rotateDirection = 1;

    if (
      (lockedAxisIndex === 1 && lockedAxis === "x" && rotateAxis === "y") ||
      (lockedAxisIndex === 1 && lockedAxis === "y" && rotateAxis === "z") ||
      (lockedAxisIndex === 1 && lockedAxis === "z" && rotateAxis === "x") ||
      (lockedAxisIndex === -1 && lockedAxis === "x" && rotateAxis === "z") ||
      (lockedAxisIndex === -1 && lockedAxis === "y" && rotateAxis === "x") ||
      (lockedAxisIndex === -1 && lockedAxis === "z" && rotateAxis === "y")
    ) {
      rotateDirection *= -1;
    }

    if (deltaDistance < 0) {
      rotateDirection *= -1;
    }
    if (reverseDirection) {
      rotateDirection *= -1;
    }
    return rotateDirection;
  }

  setRotateToNeighbor(index) {
    const theOtherIndex = Math.abs(index - 1);

    this.rotateAxis = this.neighbors[index].axis;
    this.rotateWallNumber = this.neighbors[index].wallNumber;
    this.rotateDirection = this.getRotateDirection(
      this.neighbors[index],
      this.initialDistances[theOtherIndex] -
        this.currentDistances[theOtherIndex]
    );
  }

  mouseDownHandler(event) {
    let clientX, clientY;
    if (event.clientX) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const mouse = new Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, this.camera);
    const [firstHit] = raycaster.intersectObjects(this.cube.mesh.children);

    this.isIntersecting = false;
    if (firstHit) {
      event.preventDefault();
      event.stopPropagation();
      this.isIntersecting = true;
      this.initialMouse = new Vector2(clientX, clientY);
      const clickedCube = firstHit.object;
      const [lockedAxis, lockedAxisIndex] = GestureHandler.calculateLockedAxis(
        firstHit.face.normal
      );
      this.lockedAxis = lockedAxis;
      this.lockedAxisIndex = lockedAxisIndex;
      const unlockedAxis = GestureHandler.calculateUnlockedAxis(lockedAxis);
      const localNeighbors = [
        clickedCube.position.clone(),
        clickedCube.position.clone(),
      ];

      unlockedAxis.forEach((axis, index) => {
        if (clickedCube.position[axis] === this.cube.positions[0]) {
          localNeighbors[index][axis] = this.cube.positions[1];
          localNeighbors[index].wallNumber = 0;
        } else {
          const positionIndex = this.cube.positions.findIndex(
            (dimension) => dimension === clickedCube.position[axis]
          );
          localNeighbors[index][axis] = this.cube.positions[positionIndex - 1];
          localNeighbors[index].wallNumber = positionIndex;
        }
        localNeighbors[index].axis = axis;
      });

      const canvas = this.renderer.domElement;
      this.neighbors = localNeighbors.map((neighbor) => {
        neighbor.project(this.camera);
        const { x, y, axis, wallNumber } = neighbor;
        const theOtherAxis =
          unlockedAxis[0] === axis ? unlockedAxis[1] : unlockedAxis[0];
        return {
          x: Math.round(((x + 1) * canvas.width) / 2),
          y: Math.round(((-y + 1) * canvas.height) / 2),
          axis,
          wallNumber,
          reverseDirection: clickedCube.position[theOtherAxis] >= 0,
        };
      });
    }
  }

  mouseMoveHandler(event) {
    let clientX, clientY;
    if (event.clientX) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    if (this.initialMouse) {
      event.preventDefault();
      event.stopPropagation();
      const currentMouse = new Vector2(clientX, clientY);
      const offset = this.initialMouse.distanceTo(currentMouse);

      if (offset > 5 && !this.rotateAxis) {
        this.initialDistances = [
          this.initialMouse.distanceTo(this.neighbors[0]),
          this.initialMouse.distanceTo(this.neighbors[1]),
        ];
        this.currentDistances = [
          currentMouse.distanceTo(this.neighbors[0]),
          currentMouse.distanceTo(this.neighbors[1]),
        ];
        const deltaDistances = this.initialDistances.map(
          (initialDistance, index) =>
            Math.abs(initialDistance - this.currentDistances[index])
        );
        if (deltaDistances[0] < deltaDistances[1]) {
          this.setRotateToNeighbor(0);
        } else {
          this.setRotateToNeighbor(1);
        }
      }
    }
  }

  mouseUpHandler() {
    if (this.rotateAxis) {
      this.cube.queueTurn(
        this.rotateAxis,
        this.rotateWallNumber,
        this.rotateDirection
      );
    }
    this.rotateAxis = null;
    this.initialMouse = null;
    this.initialMouse = null;
  }
}
