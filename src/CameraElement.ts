import { ContainerElement, ContainerElementConfig } from "./ContainerElement"

import type { PixiLayoutFactory } from "./PixiLayoutFactory"

import { Camera3d } from "./projection/proj3d/Camera3d"

export interface CameraElementConfig extends ContainerElementConfig<"camera", CameraElement> {
	position3d?: {x?: number, y?: number, z?: number}
	focus?: number
	near?: number
	far?: number
	orthographic?: boolean
	projectionOffset?: number[]
	projectionAnchor?: number[] | number
}

export class CameraElement extends ContainerElement<Camera3d> {
	private _projectionOffsetX: number
	private _projectionOffsetY: number
	private _projectionAnchorX: number
	private _projectionAnchorY: number

	public static register(factory: PixiLayoutFactory) {
		factory.register("camera", props => new this(factory, props))
	}

	private constructor(factory: PixiLayoutFactory, config: CameraElementConfig) {
		super(factory, config, new Camera3d())
		this._projectionOffsetX = 0
		this._projectionOffsetY = 0
		this._projectionAnchorX = 0.5
		this._projectionAnchorY = 0.5
		if (config.focus !== undefined) {
			this.handle.focus = config.focus
		}
		if (config.near !== undefined) {
			this.handle.near = config.near
		}
		if (config.far !== undefined) {
			this.handle.far = config.far
		}
		if (config.orthographic !== undefined) {
			this.handle.orthographic = config.orthographic
		}
		if (config.projectionOffset !== undefined) {
			this._projectionOffsetX = config.projectionOffset[0]
			this._projectionOffsetY = config.projectionOffset[1]
		}
		if (config.projectionAnchor !== undefined) {
			if (typeof config.projectionAnchor == "number") {
				this._projectionAnchorX = config.projectionAnchor
				this._projectionAnchorY = config.projectionAnchor
			} else {
				this._projectionAnchorX = config.projectionAnchor[0]
				this._projectionAnchorY = config.projectionAnchor[1]
			}
		}
	}

	public set focus(value: number) {
		this.handle.focus = value
	}

	public get focus() {
		return this.handle.focus
	}

	public set near(value: number) {
		this.handle.near = value
	}

	public get near() {
		return this.handle.near
	}

	public set far(value: number) {
		this.handle.far = value
	}

	public get far() {
		return this.handle.far
	}

	public set orthographic(value: boolean) {
		this.handle.orthographic = value
	}

	public get orthographic() {
		return this.handle.orthographic
	}

	public get position3d() {
		return this.handle.transform.position3d
	}

	public get pivot3d() {
		return this.handle.transform.pivot3d
	}

	public get scale3d() {
		return this.handle.transform.scale3d
	}

	public set projectionOffsetX(value: number) {
		if (this._projectionOffsetX != value) {
			this._projectionOffsetX = value
			this.setDirty()
		}
	}

	public get projectionOffsetX() {
		return this._projectionOffsetX
	}

	public set projectionOffsetY(value: number) {
		if (this._projectionOffsetY != value) {
			this._projectionOffsetY = value
			this.setDirty()
		}
	}

	public get projectionOffsetY() {
		return this._projectionOffsetY
	}

	public set projectionAnchorX(value: number) {
		if (this._projectionAnchorX != value) {
			this._projectionAnchorX = value
			this.setDirty()
		}
	}

	public get projectionAnchorX() {
		return this._projectionAnchorX
	}

	public set projectionAnchorY(value: number) {
		if (this._projectionAnchorY != value) {
			this._projectionAnchorY = value
			this.setDirty()
		}
	}

	public get projectionAnchorY() {
		return this._projectionAnchorY
	}

	protected onUpdate() {
		super.onUpdate()
		const scale = this._scale
		const offsetX = this._projectionOffsetX + this.computedWidth * this._projectionAnchorX
		const offsetY = this._projectionOffsetY + this.computedHeight * this._projectionAnchorY
		this.handle.position3d.set(offsetX, offsetY)
		this.handle.position.x += offsetX * scale
		this.handle.position.y += offsetY * scale
	}
}

export default CameraElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"camera": CameraElementConfig
	}
}
