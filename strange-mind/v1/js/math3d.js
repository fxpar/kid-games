// Petite bibliothèque de maths 3D : vecteurs (tableaux [x,y,z]) et quaternions.
// Repère monde : x vers la droite, y vers le haut, z vers le joueur.

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export const DEG = Math.PI / 180;
/** Ramène un angle en degrés dans [0, 360). */
export const norm360 = (d) => ((Math.round(d) % 360) + 360) % 360;

export class Quat {
  constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }

  static axisAngle(axis, angle) {
    const a = norm(axis), s = Math.sin(angle / 2);
    return new Quat(a[0] * s, a[1] * s, a[2] * s, Math.cos(angle / 2));
  }

  /** Rotation minimale qui amène le vecteur unitaire a sur le vecteur unitaire b. */
  static fromUnitVectors(a, b) {
    const d = dot(a, b);
    if (d < -0.999999) {
      let axis = cross([0, 1, 0], a);
      if (len(axis) < 1e-6) axis = cross([1, 0, 0], a);
      return Quat.axisAngle(axis, Math.PI);
    }
    const c = cross(a, b);
    return new Quat(c[0], c[1], c[2], 1 + d).normalize();
  }

  /** this * b : applique d'abord b, puis this. */
  mul(b) {
    const a = this;
    return new Quat(
      a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
      a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    );
  }

  rot(v) {
    const { x, y, z, w } = this;
    const tx = 2 * (y * v[2] - z * v[1]);
    const ty = 2 * (z * v[0] - x * v[2]);
    const tz = 2 * (x * v[1] - y * v[0]);
    return [
      v[0] + w * tx + (y * tz - z * ty),
      v[1] + w * ty + (z * tx - x * tz),
      v[2] + w * tz + (x * ty - y * tx),
    ];
  }

  normalize() {
    const l = Math.hypot(this.x, this.y, this.z, this.w) || 1;
    this.x /= l; this.y /= l; this.z /= l; this.w /= l;
    return this;
  }

  clone() { return new Quat(this.x, this.y, this.z, this.w); }

  static slerp(a, b, t) {
    let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    let bx = b.x, by = b.y, bz = b.z, bw = b.w;
    if (cos < 0) { cos = -cos; bx = -bx; by = -by; bz = -bz; bw = -bw; }
    let k0, k1;
    if (cos > 0.9995) { k0 = 1 - t; k1 = t; }
    else {
      const th = Math.acos(cos), s = Math.sin(th);
      k0 = Math.sin((1 - t) * th) / s; k1 = Math.sin(t * th) / s;
    }
    return new Quat(a.x * k0 + bx * k1, a.y * k0 + by * k1, a.z * k0 + bz * k1, a.w * k0 + bw * k1).normalize();
  }
}

export const Z = [0, 0, 1];
