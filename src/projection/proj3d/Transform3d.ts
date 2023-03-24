import { Transform } from "@pixi/math"
import { Matrix3d } from "../Matrix3d.js"
import { ObservableEuler } from "../ObservableEuler.js"
import { ObservablePoint3d } from "../ObservablePoint3d.js"
import { CameraTransform3d } from "./CameraTransform3d.js"

export class Transform3d extends Transform {
	public readonly localTransform3d: Matrix3d
	public readonly worldTransform3d: Matrix3d

	public readonly position: ObservablePoint3d
	public readonly scale: ObservablePoint3d
	public readonly euler: ObservableEuler
	public readonly pivot: ObservablePoint3d

	public onUpdate?: () => void

	public constructor() {
		super()
		this.localTransform3d = new Matrix3d()
		this.worldTransform3d = new Matrix3d()
		this.position = new ObservablePoint3d(this.onChange, this, 0, 0)
		this.scale = new ObservablePoint3d(this.onChange, this, 1, 1, 1)
		this.euler = new ObservableEuler(this.onChange, this, 0, 0, 0)
		this.pivot = new ObservablePoint3d(this.onChange, this, 0, 0, 0)
	}

	public updateLocalTransform() {
		if (this._localID !== this._currentLocalID) {
			const localTransform3d = this.localTransform3d
			const pos = this.position
			const scale = this.scale
			const pivot = this.pivot
			const euler = this.euler

			euler.update()
			localTransform3d.setToRotationTranslationScale(euler.quaternion, pos._x, pos._y, pos._z, scale._x, scale._y, scale._z)
			localTransform3d.translate(-pivot._x, -pivot._y, -pivot._z)

			this._currentLocalID = this._localID
			// force an update..
			this._parentID = -1
		}
	}

	public updateTransform(parentTransform: Transform3d | CameraTransform3d) {
		this.updateLocalTransform()
		if (this._parentID !== parentTransform._worldID) {
			super.updateTransform(parentTransform)
			this.worldTransform3d.setToMult(parentTransform.worldTransform3d, this.localTransform3d)
			this.worldTransform3d.copyTo(this.worldTransform)

			this._parentID = parentTransform._worldID
			// update the id of the transform..
			this._worldID++
			if (this.onUpdate) {
				this.onUpdate()
			}
		}
	}
}
