import { ObservablePoint } from "@pixi/math"
import { IPointData3d } from "./IPointData3d.js"

export class ObservablePoint3d<T = any> extends ObservablePoint<T> {
	// @internal
	_z: number

	constructor(callback: (this: T) => void, scope: T, x = 0, y = 0, z = 0) {
		super(callback, scope, x, y)
		this._z = z
	}

	clone(cb = this.cb, scope = this.scope) {
		return new ObservablePoint3d(cb, scope, this._x, this._y, this._z)
	}

	set(x = 0, y = x, z?: number) {
		if (z === undefined) {
			if (this._x !== x || this._y !== y) {
				this._x = x
				this._y = y
				this.cb.call(this.scope)
			}
		} else {
			if (this._x !== x || this._y !== y || this._z != z) {
				this._x = x
				this._y = y
				this._z = z
				this.cb.call(this.scope)
			}
		}
		return this
	}

	copyFrom(p: IPointData3d) {
		if (this._x !== p.x || this._y !== p.y || this._z != p.z) {
			this._x = p.x
			this._y = p.y
			this._z = p.z
			this.cb.call(this.scope)
		}
		return this
	}

	equals(p: IPointData3d) {
		return (p.x === this._x) && (p.y === this._y) && (p.z === this._z)
	}

	get z() {
		return this._z
	}

	set z(value: number) {
		if (this._z !== value) {
			this._z = value
			this.cb.call(this.scope)
		}
	}
}
