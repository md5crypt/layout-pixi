import { Container } from "@pixi/display"
import { Transform3d } from "./Transform3d.js"

export class Container3d extends Container {
	declare transform: Transform3d

	constructor() {
		super()
		this.transform = new Transform3d()
	}

	isFrontFace(forceUpdate = false): boolean {
		if (forceUpdate) {
			this._recursivePostUpdateTransform()
			this.displayObjectUpdateTransform()
		}
		return this.transform.worldTransform3d.isFrontFace()
	}

	getDepth(forceUpdate = false) {
		if (forceUpdate) {
			this._recursivePostUpdateTransform()
			this.displayObjectUpdateTransform()
		}
		return this.transform.worldTransform3d.getDepth()
	}

	get euler() {
		return this.transform.euler
	}

	get position() {
		return this.transform.position
	}

	get scale() {
		return this.transform.scale
	}

	get pivot() {
		return this.transform.pivot
	}
}
