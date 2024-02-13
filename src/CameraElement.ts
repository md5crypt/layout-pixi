import { ContainerElement, ContainerElementConfig } from "./ContainerElement.js"

import type { PixiLayoutFactory } from "./PixiLayoutFactory.js"

import { Camera3d } from "./projection/proj3d/Camera3d.js"

interface PlaneConfig {
	focus: number
	near: number
	far: number
	orthographic: boolean
}

export interface CameraElementConfig extends ContainerElementConfig<"camera", CameraElement>, Partial<PlaneConfig> {
	position3d?: {x?: number, y?: number, z?: number}
}

export class CameraElement extends ContainerElement<Camera3d> {
	private planeConfig: PlaneConfig

	public static register(factory: PixiLayoutFactory) {
		factory.register("camera", props => new this(factory, props))
	}

	private constructor(factory: PixiLayoutFactory, config: CameraElementConfig) {
		super(factory, config, new Camera3d())
		this.planeConfig = {
			focus: 400,
			near: 10,
			far: 1000,
			orthographic: false
		}

		if (config.focus !== undefined) {
			this.planeConfig.focus = config.focus
		}
		if (config.near !== undefined) {
			this.planeConfig.near = config.near
		}
		if (config.far !== undefined) {
			this.planeConfig.far = config.far
		}
		if (config.orthographic !== undefined) {
			this.planeConfig.orthographic = config.orthographic
		}
		this.updatePlanes()
	}

	public set focus(value: number) {
		this.planeConfig.focus = value
		this.updatePlanes()
	}

	public get focus() {
		return this.planeConfig.focus
	}

	public set near(value: number) {
		this.planeConfig.near = value
		this.updatePlanes()
	}

	public get near() {
		return this.planeConfig.near
	}

	public set far(value: number) {
		this.planeConfig.far = value
		this.updatePlanes()
	}

	public get far() {
		return this.planeConfig.far
	}

	public set orthographic(value: boolean) {
		this.planeConfig.orthographic = value
		this.updatePlanes()
	}

	public get orthographic() {
		return this.planeConfig.orthographic
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
		this.handle.transform.position3d.x = value
		this.setDirty()
	}

	public get projectionOffsetX() {
		return this.handle.transform.position3d.x
	}

	public set projectionOffsetY(value: number) {
		this.handle.transform.position3d.y = value
		this.setDirty()
	}

	public get projectionOffsetY() {
		return this.handle.transform.position3d.y
	}

	private updatePlanes() {
		this.handle.setPlanes(this.planeConfig.focus, this.planeConfig.near, this.planeConfig.far, this.planeConfig.orthographic)
	}

	protected onUpdate() {
		super.onUpdate()
		const scale = this._scale
		this.handle.position.x += this.handle.position3d.x * scale
		this.handle.position.y += this.handle.position3d.y * scale
	}
}

export default CameraElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"camera": CameraElementConfig
	}
}
