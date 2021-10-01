import { ContainerElement } from "../ContainerElement.js"
import { BaseConstructorProperties, BaseConfig } from "../BaseElement.js"

import type LayoutFactory from "../LayoutFactory.js"

import { Camera3d } from "pixi-projection"

interface PlaneConfig {
	focus: number
	near: number
	far: number
	orthographic: boolean
}

export interface CameraElementConfig extends BaseConfig<CameraElement>, Partial<PlaneConfig> {
	position3d?: {x?: number, y?: number, z?: number}
}

export class CameraElement extends ContainerElement {
	declare public handle: Camera3d
	private planeConfig: PlaneConfig

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("camera", props => new this(props, new Camera3d()))
	}

	constructor(props: BaseConstructorProperties<CameraElementConfig>, handle: Camera3d) {
		super(props, handle)
		this.planeConfig = {
			focus: 400,
			near: 10,
			far: 1000,
			orthographic: false
		}
		if (props.config) {
			if (props.config.position3d) {
				this.handle.position3d.x = props.config.position3d.x || 0
				this.handle.position3d.y = props.config.position3d.y || 0
				this.handle.position3d.z = props.config.position3d.z
			}
			if (props.config.focus !== undefined) {
				this.planeConfig.focus = props.config.focus
			}
			if (props.config.near !== undefined) {
				this.planeConfig.near = props.config.near
			}
			if (props.config.far !== undefined) {
				this.planeConfig.far = props.config.far
			}
			if (props.config.orthographic !== undefined) {
				this.planeConfig.orthographic = props.config.orthographic
			}
			this.updatePlanes()
		}
	}

	public get position3d() {
		return this.handle.position3d
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

	private updatePlanes() {
		this.handle.setPlanes(this.planeConfig.focus, this.planeConfig.near, this.planeConfig.far, this.planeConfig.orthographic)
	}

	protected onUpdate() {
		super.onUpdate()
	}
}

export default CameraElement

declare module "../ElementTypes" {
	export interface ElementTypes {
		"camera": {config: CameraElementConfig, element: CameraElement}
	}
}
