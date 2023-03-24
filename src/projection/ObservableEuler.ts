export class ObservableEuler<T = any> {
	public readonly quaternion: Float64Array

	private _quatUpdateId = -1
	private _quatDirtyId = 0

	private _x: number
	private _y: number
	private _z: number
	private _sign: number

	private _callback: (this: T) => void
	private _scope: T

	constructor(callback: (this: T) => void, scope: T, x = 0, y = 0, z = 0) {
		this._x = x
		this._y = y
		this._z = z
		this._sign = 1
		this._callback = callback
		this._scope = scope

		this.quaternion = new Float64Array(4)
		this.quaternion[3] = 1
		this._quatUpdateId = -1
		this._quatDirtyId = 0

		this.update()
	}

	get sign() {
		return this._sign
	}

	set sign(value: number) {
		if (this._sign !== value) {
			this._sign = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get x(): number {
		return this._x
	}

	set x(value: number) {
		if (this._x !== value) {
			this._x = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get y(): number {
		return this._y
	}

	set y(value: number) {
		if (this._y !== value) {
			this._y = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get z(): number {
		return this._z
	}

	set z(value: number) {
		if (this._z !== value) {
			this._z = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get pitch(): number {
		return this._x
	}

	set pitch(value: number) {
		if (this._x !== value) {
			this._x = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get yaw(): number {
		return this._y
	}

	set yaw(value: number) {
		if (this._y !== value) {
			this._y = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	get roll(): number {
		return this._z
	}

	set roll(value: number) {
		if (this._z !== value) {
			this._z = value
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}
	}

	set(x?: number, y?: number, z?: number) {
		const _x = x || 0
		const _y = y || 0
		const _z = z || 0

		if (this._x !== _x || this._y !== _y || this._z !== _z) {
			this._x = _x
			this._y = _y
			this._z = _z
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}

		return this
	}

	copyFrom(euler: ObservableEuler): this {
		const _x = euler.x
		const _y = euler.y
		const _z = euler.z

		if (this._x !== _x || this._y !== _y || this._z !== _z) {
			this._x = _x
			this._y = _y
			this._z = _z
			this._quatDirtyId += 1
			this._callback.call(this._scope)
		}

		return this
	}

	copyTo(p: ObservableEuler) {
		p.set(this._x, this._y, this._z)
		return p
	}

	equals(euler: ObservableEuler): boolean {
		return this._x === euler.x && this._y === euler.y && this._z === euler.z
	}

	update(): boolean {
		if (this._quatUpdateId === this._quatDirtyId) {
			return false
		}
		this._quatUpdateId = this._quatDirtyId

		const c1 = Math.cos(this._x / 2)
		const c2 = Math.cos(this._y / 2)
		const c3 = Math.cos(this._z / 2)

		const s = this._sign
		const s1 = s * Math.sin(this._x / 2)
		const s2 = s * Math.sin(this._y / 2)
		const s3 = s * Math.sin(this._z / 2)

		const q = this.quaternion

		q[0] = (s1 * c2 * c3) + (c1 * s2 * s3)
		q[1] = (c1 * s2 * c3) - (s1 * c2 * s3)
		q[2] = (c1 * c2 * s3) + (s1 * s2 * c3)
		q[3] = (c1 * c2 * c3) - (s1 * s2 * s3)

		return true
	}
}
