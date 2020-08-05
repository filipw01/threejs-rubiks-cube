import Cube from "./Cube";

describe("Cube class", () => {
  test("should initialize with defaults", () => {
    const cube = new Cube();
    expect(cube.mesh.position.x).toBe(0);
    expect(cube.mesh.position.y).toBe(0);
    expect(cube.mesh.position.z).toBe(0);
    expect(cube.colors).toEqual(Array(6).fill(null));
  });

  test("should change material on color change", () => {
    const cube = new Cube(0, 0, 0, Array(6).fill(0x0000ff));
    function getFirstMaterial() {
      return cube.mesh.material.map((material) => {
        const { r, g, b } = material.color;
        return { r, g, b };
      })[0];
    }
    expect(getFirstMaterial()).toEqual({ r: 0, g: 0, b: 1 });
    cube.colors = Array(6).fill(0xff0000);
    expect(getFirstMaterial()).toEqual({ r: 1, g: 0, b: 0 });
  });

  test("should provide morph attributes", () => {
    const geometry = Cube.createGeometry();
    const attributes = geometry.morphAttributes.position[0].array;
    expect(attributes[0]).not.toBe(null);
    expect(attributes[0]).not.toBe(undefined);
  });
});
