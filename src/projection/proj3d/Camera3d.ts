import { Container } from "@pixi/display"
import { CameraTransform3d } from "./CameraTransform3d.js"

export class Camera3d extends Container {
	declare transform: CameraTransform3d

	private _far = 0
	private _near = 0
	private _focus = 0
	private _orthographic = false

	constructor() {
		super()
		this.transform = new CameraTransform3d()
		this.setPlanes(400, 10, 10000, false)
	}

	get far() {
		return this._far
	}

	public set far(value: number) {
		if (this._far != value) {
			this._far = value
		}
		this.updatePlanes()
	}

	get near() {
		return this._near
	}

	public set near(value: number) {
		if (this._near != value) {
			this._near = value
		}
		this.updatePlanes()
	}

	get focus() {
		return this._focus
	}

	public set focus(value: number) {
		if (this._focus != value) {
			this._focus = value
		}
		this.updatePlanes()
	}

	get orthographic() {
		return this._orthographic
	}

	public set orthographic(value: boolean) {
		if (this.orthographic != value) {
			this.orthographic = value
		}
		this.updatePlanes()
	}

	public get position3d() {
		return this.transform.position3d
	}

	public get pivot3d() {
		return this.transform.pivot3d
	}

	public get scale3d() {
		return this.transform.scale3d
	}

	setPlanes(focus: number, near = 10, far = 10000, orthographic = false): void {
		this._focus = focus
		this._near = near
		this._far = far
		this._orthographic = orthographic
		this.updatePlanes()
	}

	private updatePlanes() {
		this.transform.setPlanes(this._focus, this._near, this._far, this._orthographic)
	}
}
