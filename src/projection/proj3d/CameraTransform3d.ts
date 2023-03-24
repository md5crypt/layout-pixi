import { Transform } from "@pixi/math"
import { Matrix3d } from "../Matrix3d.js"
import { ObservablePoint3d } from "../ObservablePoint3d.js"

export class CameraTransform3d extends Transform {
	public readonly position3d: ObservablePoint3d
	public readonly scale3d: ObservablePoint3d
	public readonly pivot3d: ObservablePoint3d

	private _cameraMatrix: Matrix3d

	public readonly localTransform3d: Matrix3d
	public readonly worldTransform3d: Matrix3d

	public constructor() {
		super()
		this._cameraMatrix = new Matrix3d()
		this.localTransform3d = new Matrix3d()
		this.worldTransform3d = new Matrix3d()
		this.position3d = new ObservablePoint3d(this.onChange, this, 0, 0, 0)
		this.scale3d = new ObservablePoint3d(this.onChange, this, 1, 1, 1)
		this.pivot3d = new ObservablePoint3d(this.onChange, this, 0, 0, 0)
	}

	updateLocalTransform() {
		if (this._localID !== this._currentLocalID) {
			super.updateLocalTransform()
			const localTransform3d = this.localTransform3d
			const pos = this.position3d
			const scale = this.scale3d
			const pivot = this.pivot3d
			localTransform3d.setToMultLegacy(this.localTransform, this._cameraMatrix)
			localTransform3d.translate(pivot._x, pivot._y, pivot._z)
			localTransform3d.scale(1.0 / scale._x, 1.0 / scale._y, 1.0 / scale._z)
			localTransform3d.translate(-pos._x, -pos._y, -pos._z)
		}
	}

	public updateTransform(parentTransform: Transform) {
		this.updateLocalTransform()
		if (this._parentID !== parentTransform._worldID) {
			this.worldTransform3d.setToMultLegacy(parentTransform.worldTransform, this.localTransform3d)
			this.worldTransform3d.copyTo(this.worldTransform)

			this._parentID = parentTransform._worldID
			// update the id of the transform..
			this._worldID++
		}
	}

	public setPlanes(focus: number, near: number, far: number, orthographic: boolean) {
		const mat4 = this._cameraMatrix.mat4
		mat4[10] = 1.0 / (far - near)
		mat4[14] = (focus - near) / (far - near)
		if (orthographic) {
			mat4[11] = 0
		} else {
			mat4[11] = 1.0 / focus
		}
		this.onChange()
	}
}
