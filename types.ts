
export interface Point3D {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface TriangleShape {
  id: string;
  pointIds: [string, string, string]; // IDs of the three points forming the triangle
  name: string; // e.g., "Triangle 1 (P1-P2-P3)"
}
