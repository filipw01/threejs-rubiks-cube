import {
  Mesh,
  MeshPhongMaterial,
  BoxBufferGeometry,
  Float32BufferAttribute,
} from "three";

export default class Cube {
  constructor(x = 0, y = 0, z = 0, colors = new Array(6).fill(null)) {
    this.geometry = this.createGeometry();
    this.material = [];
    this.mesh = new Mesh(this.geometry, this.material);
    this.colors = colors;
    this.mesh.position.set(x, y, z);
  }

  get colors() {
    return this._colors;
  }

  set colors(newColors) {
    // Store raw colors
    this._colors = newColors;
    this.applyColors();
  }

  applyColors() {
    // Maps colors to material
    this.material = this.colors.map(
      (color) =>
        new MeshPhongMaterial({
          color: color === null ? 0xcccccc : color,
          shininess: 80,
          flatShading: true,
          morphTargets: true,
        })
    );
    // Update cube material
    this.mesh.material = this.material;
  }

  createGeometry() {
    // Create cube with many vertices
    const geometry = new BoxBufferGeometry(2, 2, 2, 32, 32, 32);

    // Map vertices onto sphere
    const spherePositions = [];
    const positions = geometry.attributes.position.array;

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

    // Add morphing to sphere as a target
    geometry.morphAttributes.position = [];
    geometry.morphAttributes.position[0] = new Float32BufferAttribute(
      spherePositions,
      3
    );

    return geometry;
  }
}
