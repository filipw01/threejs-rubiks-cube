import {
  Mesh,
  Vector3,
  Vector2,
  MeshPhongMaterial,
  BoxBufferGeometry,
  Float32BufferAttribute,
} from "three";

export default class Cube {
  constructor(x = 0, y = 0, z = 0, colors = new Array(6).fill(null)) {
    this.geometry = this.createGeometry();
    this.colors = colors;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.set(x, y, z);
  }
  calculateScreenPosition(camera) {
    const projectedVector = this.mesh.position.clone();
    projectedVector.project(camera);
    return projectedVector;
  }
  registerEvents(camera, dimensions, scene) {
    let initialDistances;
    let deltaDistances;
    this.mesh.on("mousedown", (e) => {
      const wallCenterVectors = [
        new Vector3(0, 0, dimensions[0]),
        new Vector3(0, 0, dimensions[dimensions.length - 1]),
        new Vector3(0, dimensions[0], 0),
        new Vector3(0, dimensions[dimensions.length - 1], 0),
        new Vector3(dimensions[0], 0, 0),
        new Vector3(dimensions[dimensions.length - 1], 0, 0),
      ];
      initialDistances = wallCenterVectors
        .map((wallCenter) => wallCenter.project(camera))
        .map((vector) =>
          vector.distanceTo(this.calculateScreenPosition(camera))
        );
      this.calculateScreenPosition(camera);
    });
    scene.on("mouseup", () => {
      if (deltaDistances) console.log(deltaDistances);
      initialDistances = null;
      deltaDistances = null;
    });
    scene.on("mousemove", (e) => {
      if (initialDistances) {
        const wallCenterVectors = [
          new Vector3(0, 0, dimensions[0]),
          new Vector3(0, 0, dimensions[dimensions.length - 1]),
          new Vector3(0, dimensions[0], 0),
          new Vector3(0, dimensions[dimensions.length - 1], 0),
          new Vector3(dimensions[0], 0, 0),
          new Vector3(dimensions[dimensions.length - 1], 0, 0),
        ];
        deltaDistances = wallCenterVectors
          .map((wallCenter) => wallCenter.project(camera))
          .map(
            (vector, index) =>
              vector.distanceTo(
                new Vector3(
                  (e.data.originalEvent.clientX / window.innerWidth) * 2 - 1,
                  (e.data.originalEvent.clientY / window.innerHeight) * 2 - 1,
                  0
                )
              ) - initialDistances[index]
          );
      }
    });
  }
  get colors() {
    return this._colors;
  }
  set colors(newColors) {
    this.material = newColors.map((color) => {
      let materialColor = color;
      if (color === null) {
        materialColor = 0xaaaaaa;
      }
      return new MeshPhongMaterial({
        color: materialColor,
        shininess: 80,
        flatShading: true,
        morphTargets: true,
      });
    });
    if (this.mesh) {
      this.mesh.material = this.material;
    }
    this._colors = newColors;
  }
  createGeometry() {
    const geometry = new BoxBufferGeometry(2, 2, 2, 32, 32, 32);

    // create an empty array to hold targets for the attribute we want to morph
    geometry.morphAttributes.position = [];

    // the original positions of the cube's vertices
    const positions = geometry.attributes.position.array;

    // for the first morph target we'll move the cube's vertices onto the surface of a sphere
    const spherePositions = [];

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      spherePositions.push(
        x * Math.sqrt(1 - (y * y) / 2 - (z * z) / 2 + (y * y * z * z) / 3),
        y * Math.sqrt(1 - (z * z) / 2 - (x * x) / 2 + (z * z * x * x) / 3),
        z * Math.sqrt(1 - (x * x) / 2 - (y * y) / 2 + (x * x * y * y) / 3)
      );
    }

    // add the spherical positions as the first morph target
    geometry.morphAttributes.position[0] = new Float32BufferAttribute(
      spherePositions,
      3
    );

    return geometry;
  }
}
