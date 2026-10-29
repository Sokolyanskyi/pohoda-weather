import { describe, expect, it } from "vitest";
import { ARC_SHAPE, arcGeometry, arcPath, arcPoint, arcSegment } from "@/lib/arc";

const geometry = arcGeometry(600, 150);

describe("sun arc geometry", () => {
  it("starts and ends on the horizon inside the box", () => {
    const start = arcPoint(geometry, 0);
    const end = arcPoint(geometry, 1);
    expect(start.x).toBeCloseTo(600 * ARC_SHAPE.left, 5);
    expect(end.x).toBeCloseTo(600 * ARC_SHAPE.right, 5);
    expect(start.y).toBeCloseTo(end.y, 5);
    expect(start.y).toBeCloseTo(150 * ARC_SHAPE.bottom, 5);
  });

  it("reaches the apex in the middle", () => {
    const middle = arcPoint(geometry, 0.5);
    expect(middle.x).toBeCloseTo(300, 5);
    expect(middle.y).toBeCloseTo(150 * ARC_SHAPE.top, 5);
  });

  it("clamps progress outside 0..1", () => {
    expect(arcPoint(geometry, -1)).toEqual(arcPoint(geometry, 0));
    expect(arcPoint(geometry, 2)).toEqual(arcPoint(geometry, 1));
  });

  it("draws the full arc from end to end", () => {
    expect(arcPath(geometry)).toMatch(/^M.+Q.+$/);
    expect(arcSegment(geometry, 0)).toBe("");
    expect(arcSegment(geometry, 1)).toBe(arcPath(geometry));
  });

  it("ends the lit segment exactly under the sun", () => {
    for (const progress of [0.1, 0.35, 0.5, 0.8, 0.99]) {
      const segment = arcSegment(geometry, progress);
      const numbers = segment.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const endX = numbers[numbers.length - 2];
      const endY = numbers[numbers.length - 1];
      const point = arcPoint(geometry, progress);
      expect(endX).toBeCloseTo(point.x, 1);
      expect(endY).toBeCloseTo(point.y, 1);
    }
  });
});
