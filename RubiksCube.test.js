import RubiksCube from "./RubiksCube";
import { Scene } from "three";

function getColors(children) {
  return children.map((child) =>
    child.material.map((singleMaterial) => {
      const { r, g, b } = singleMaterial.color;
      return { r, g, b };
    })
  );
}

const initializeRubiksCube = () => {
  const scene = new Scene();
  const cube = new RubiksCube(scene);
  return cube;
};

describe("RubiksCube class", () => {
  test("should generate positions for 1x1 cube", () => {
    const positions = RubiksCube.generatePositions(1, 10);
    expect(positions).toEqual([0]);
  });

  test("should generate positions for 2x2 cube", () => {
    const positions = RubiksCube.generatePositions(2, 0.2);
    expect(positions).toEqual([-1.1, 1.1]);
  });

  test("should generate positions for 3x3 cube", () => {
    const positions = RubiksCube.generatePositions(3, 1);
    expect(positions).toEqual([-3, 0, 3]);
  });

  test("should generate cubes for 5x5 cube", () => {
    const Color = {
      DEFAULT: 0x000000,
      GREEN: 0x00ff00,
      YELLOW: 0xffff00,
      BLUE: 0x0000ff,
      RED: 0xff0000,
      WHITE: 0xffffff,
      ORANGE: 0xffff00,
    };
    const positions = [-4, -2, 0, 2, 4];
    const mesh = RubiksCube.generateCubes(positions, Color);
    expect(mesh.children.length).toBe(5 * 5 * 5);
  });

  test("should generate cubes colors for 1x1 cube", () => {
    const Color = {
      DEFAULT: 0x000000,
      GREEN: 0x00ff00,
      YELLOW: 0xffff00,
      BLUE: 0x0000ff,
      RED: 0xff0000,
      WHITE: 0xffffff,
      ORANGE: 0xffff00,
    };
    const positions = [0];
    const mesh = RubiksCube.generateCubes(positions, Color);

    const facesColors = getColors(mesh.children);
    expect(facesColors).toMatchSnapshot();
  });

  test("should generate cubes colors for 4x4 cube", () => {
    const Color = {
      DEFAULT: 0x000000,
      GREEN: 0x00ff00,
      YELLOW: 0xffff00,
      BLUE: 0x0000ff,
      RED: 0xff0000,
      WHITE: 0xffffff,
      ORANGE: 0xffff00,
    };
    const positions = [-3, -1, 1, 3];
    const mesh = RubiksCube.generateCubes(positions, Color);

    const facesColors = getColors(mesh.children);
    expect(facesColors).toMatchSnapshot();
  });

  test("should group", () => {
    const cube = initializeRubiksCube();
    expect(cube.mesh.children.length).toBe(27);
    const wall = cube.group("x", 0);
    expect(wall.children.length).toBe(9);
    expect(cube.mesh.children.length).toBe(27 - 9);
  });

  test("should ungroup", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    cube.ungroup(wall);
    expect(wall.children.length).toBe(0);
    expect(cube.mesh.children.length).toBe(27);
  });

  test("should move cubes in wall", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);

    cube.moveCubesColors(wall);
    const currentWallColors = getColors(wall.children);

    expect(currentWallColors).not.toEqual(initialWallColors);
    expect(currentWallColors).toMatchSnapshot();
  });

  test("should return to initial position after moving back and forth", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);
    cube.moveCubesColors(wall);
    cube.moveCubesColors(wall, -1);
    const currentWallColors = getColors(wall.children);
    expect(currentWallColors).toEqual(initialWallColors);
  });

  test("should return to initial position after moving 4 times", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);
    for (let i = 0; i < 4; i++) {
      cube.moveCubesColors(wall);
    }
    const currentWallColors = getColors(wall.children);
    expect(currentWallColors).toEqual(initialWallColors);
  });

  test("should rotate cubes in wall", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);

    cube.rotateCubesColors(wall, "x");
    const currentWallColors = getColors(wall.children);

    expect(currentWallColors).not.toEqual(initialWallColors);
    expect(currentWallColors).toMatchSnapshot();
  });

  test("should return to initial position after rotating back and forth", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);
    cube.rotateCubesColors(wall, "x");
    cube.rotateCubesColors(wall, "x", -1);
    const currentWallColors = getColors(wall.children);
    expect(currentWallColors).toEqual(initialWallColors);
  });

  test("should return to initial position after rotating 4 times", () => {
    const cube = initializeRubiksCube();
    const wall = cube.group("x", 0);
    const initialWallColors = getColors(wall.children);
    for (let i = 0; i < 4; i++) {
      cube.rotateCubesColors(wall, "x");
    }
    const currentWallColors = getColors(wall.children);
    expect(currentWallColors).toEqual(initialWallColors);
  });

  test("should pick random range", () => {
    let random = RubiksCube.randomRange(100, 101);
    expect(random).toBeGreaterThanOrEqual(100);
    expect(random).toBeLessThanOrEqual(101);

    random = RubiksCube.randomRange(1, 10);
    expect(random).toBeGreaterThanOrEqual(1);
    expect(random).toBeLessThanOrEqual(10);

    random = RubiksCube.randomRange(-10, 0);
    expect(random).toBeGreaterThanOrEqual(-10);
    expect(random).toBeLessThanOrEqual(0);
  });

  test("should handle non int range in randomRange", () => {
    const random = RubiksCube.randomRange(0.5, 1.5);
    expect(random).toBe(1);
  });

  test("throws on wrong input in randomRange", () => {
    expect(() => RubiksCube.randomRange(1, 0)).toThrow("Invalid range");
  });

  test("should queue walls rotations", async () => {
    const cube = initializeRubiksCube();
    for (let i = 0; i < 10; i++) {
      cube.queueTurn("x", 0);
    }
    expect(cube.queue.length).toBe(10);
    await cube.queueWaiter;
    expect(cube.queue.length).toBe(0);
  });
});
