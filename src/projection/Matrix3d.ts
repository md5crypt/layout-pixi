import { Matrix } from "@pixi/math"

export class Matrix3d {
	public readonly mat4: Float64Array

	constructor() {
		this.mat4 = new Float64Array(16)
		this.identity()
	}

	setToTranslation(tx: number, ty: number, tz: number) {
		const mat4 = this.mat4

		mat4[0] = 1
		mat4[1] = 0
		mat4[2] = 0
		mat4[3] = 0

		mat4[4] = 0
		mat4[5] = 1
		mat4[6] = 0
		mat4[7] = 0

		mat4[8] = 0
		mat4[9] = 0
		mat4[10] = 1
		mat4[11] = 0

		mat4[12] = tx
		mat4[13] = ty
		mat4[14] = tz
		mat4[15] = 1
	}

	setToRotationTranslationScale(quat: Float64Array, tx: number, ty: number, tz: number, sx: number, sy: number, sz: number) {
		const out = this.mat4

		const x = quat[0]
		const y = quat[1]
		const z = quat[2]
		const w = quat[3]

		const x2 = x + x
		const y2 = y + y
		const z2 = z + z

		const xx = x * x2
		const xy = x * y2
		const xz = x * z2
		const yy = y * y2
		const yz = y * z2
		const zz = z * z2
		const wx = w * x2
		const wy = w * y2
		const wz = w * z2

		out[0] = (1 - (yy + zz)) * sx
		out[1] = (xy + wz) * sx
		out[2] = (xz - wy) * sx
		out[3] = 0
		out[4] = (xy - wz) * sy
		out[5] = (1 - (xx + zz)) * sy
		out[6] = (yz + wx) * sy
		out[7] = 0
		out[8] = (xz + wy) * sz
		out[9] = (yz - wx) * sz
		out[10] = (1 - (xx + yy)) * sz
		out[11] = 0
		out[12] = tx
		out[13] = ty
		out[14] = tz
		out[15] = 1
	}

	translate(tx: number, ty: number, tz: number) {
		const a = this.mat4

		a[12] = a[0] * tx + a[4] * ty + a[8] * tz + a[12]
		a[13] = a[1] * tx + a[5] * ty + a[9] * tz + a[13]
		a[14] = a[2] * tx + a[6] * ty + a[10] * tz + a[14]
		a[15] = a[3] * tx + a[7] * ty + a[11] * tz + a[15]

	}

	scale(x: number, y: number, z?: number) {
		const mat4 = this.mat4

		mat4[0] *= x
		mat4[1] *= x
		mat4[2] *= x
		mat4[3] *= x

		mat4[4] *= y
		mat4[5] *= y
		mat4[6] *= y
		mat4[7] *= y

		if (z !== undefined) {
			mat4[8] *= z
			mat4[9] *= z
			mat4[10] *= z
			mat4[11] *= z
		}
	}

	scaleAndTranslate(scaleX: number, scaleY: number, scaleZ: number, tx: number, ty: number, tz: number) {
		const mat4 = this.mat4

		mat4[0] = scaleX * mat4[0] + tx * mat4[3]
		mat4[1] = scaleY * mat4[1] + ty * mat4[3]
		mat4[2] = scaleZ * mat4[2] + tz * mat4[3]

		mat4[4] = scaleX * mat4[4] + tx * mat4[7]
		mat4[5] = scaleY * mat4[5] + ty * mat4[7]
		mat4[6] = scaleZ * mat4[6] + tz * mat4[7]

		mat4[8] = scaleX * mat4[8] + tx * mat4[11]
		mat4[9] = scaleY * mat4[9] + ty * mat4[11]
		mat4[10] = scaleZ * mat4[10] + tz * mat4[11]

		mat4[12] = scaleX * mat4[12] + tx * mat4[15]
		mat4[13] = scaleY * mat4[13] + ty * mat4[15]
		mat4[14] = scaleZ * mat4[14] + tz * mat4[15]
	}

	identity() {
		const mat3 = this.mat4

		mat3[0] = 1
		mat3[1] = 0
		mat3[2] = 0
		mat3[3] = 0

		mat3[4] = 0
		mat3[5] = 1
		mat3[6] = 0
		mat3[7] = 0

		mat3[8] = 0
		mat3[9] = 0
		mat3[10] = 1
		mat3[11] = 0

		mat3[12] = 0
		mat3[13] = 0
		mat3[14] = 0
		mat3[15] = 1
	}

	set(matrix: Matrix3d) {
		this.mat4.set(matrix.mat4)
	}

	setToMultLegacy(pt: Matrix, lt: Matrix3d) {
		const out = this.mat4
		const b = lt.mat4

		const a00 = pt.a
		const a01 = pt.b
		const a10 = pt.c
		const a11 = pt.d
		const a30 = pt.tx
		const a31 = pt.ty

		let b0 = b[0]
		let b1 = b[1]
		let b2 = b[2]
		let b3 = b[3]

		out[0] = b0 * a00 + b1 * a10 + b3 * a30
		out[1] = b0 * a01 + b1 * a11 + b3 * a31
		out[2] = b2
		out[3] = b3

		b0 = b[4]
		b1 = b[5]
		b2 = b[6]
		b3 = b[7]
		out[4] = b0 * a00 + b1 * a10 + b3 * a30
		out[5] = b0 * a01 + b1 * a11 + b3 * a31
		out[6] = b2
		out[7] = b3

		b0 = b[8]
		b1 = b[9]
		b2 = b[10]
		b3 = b[11]
		out[8] = b0 * a00 + b1 * a10 + b3 * a30
		out[9] = b0 * a01 + b1 * a11 + b3 * a31
		out[10] = b2
		out[11] = b3

		b0 = b[12]
		b1 = b[13]
		b2 = b[14]
		b3 = b[15]
		out[12] = b0 * a00 + b1 * a10 + b3 * a30
		out[13] = b0 * a01 + b1 * a11 + b3 * a31
		out[14] = b2
		out[15] = b3
	}

	setToMult(pt: Matrix3d, lt: Matrix3d) {
		Matrix3d.glMatrixMat4Multiply(this.mat4, pt.mat4, lt.mat4)
	}

	copyTo(matrix: Matrix) {
		const mat4 = this.mat4
		const d = 1.0 / mat4[15]
		const tx = mat4[12] * d
		const ty = mat4[13] * d
		matrix.a = (mat4[0] - mat4[3] * tx) * d
		matrix.b = (mat4[1] - mat4[3] * ty) * d
		matrix.c = (mat4[4] - mat4[7] * tx) * d
		matrix.d = (mat4[5] - mat4[7] * ty) * d
		matrix.tx = tx
		matrix.ty = ty
		return matrix
	}

	isFrontFace() {
		const mat = this.mat4
		const dx1 = mat[0] * mat[15] - mat[3] * mat[12]
		const dy1 = mat[1] * mat[15] - mat[3] * mat[13]
		const dx2 = mat[4] * mat[15] - mat[7] * mat[12]
		const dy2 = mat[5] * mat[15] - mat[7] * mat[13]

		return dx1 * dy2 - dx2 * dy1 > 0
	}

	getDepth() {
		const mat4 = this.mat4
		return mat4[14] / mat4[15]
	}

	static glMatrixMat4Multiply(out: Float64Array, a: Float64Array, b: Float64Array) {
		const a00 = a[0]
		const a01 = a[1]
		const a02 = a[2]
		const a03 = a[3]
		const a10 = a[4]
		const a11 = a[5]
		const a12 = a[6]
		const a13 = a[7]
		const a20 = a[8]
		const a21 = a[9]
		const a22 = a[10]
		const a23 = a[11]
		const a30 = a[12]
		const a31 = a[13]
		const a32 = a[14]
		const a33 = a[15]

		// Cache only the current line of the second matrix
		let b0 = b[0]
		let b1 = b[1]
		let b2 = b[2]
		let b3 = b[3]

		out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
		out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
		out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
		out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

		b0 = b[4]
		b1 = b[5]
		b2 = b[6]
		b3 = b[7]
		out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
		out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
		out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
		out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

		b0 = b[8]
		b1 = b[9]
		b2 = b[10]
		b3 = b[11]
		out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
		out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
		out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
		out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

		b0 = b[12]
		b1 = b[13]
		b2 = b[14]
		b3 = b[15]
		out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
		out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
		out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
		out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

		return out
	}
}
