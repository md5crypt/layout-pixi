import { ContainerElement } from "../ContainerElement.js"
import { BaseConstructorProperties, BaseConfig } from "../BaseElement.js"
import type LayoutFactory from "../LayoutFactory.js"

import { Container3d } from "pixi-projection"

export interface Container3dElementConfig extends BaseConfig<Container3dElement> {
	euler?: {x?: number, y?: number, z?: number}
	position3d?: {x?: number, y?: number, z?: number}
	scale3d?: {x?: number, y?: number, z?: number}
}

export class Container3dElement extends ContainerElement {
	declare public handle: Container3d


	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container-3d", props => new this(props, new Container3d()))
	}

	constructor(props: BaseConstructorProperties<Container3dElementConfig>, handle: Container3d) {
		super(props, handle)
		if (props.config) {
			if (props.config.euler) {
				this.handle.euler.set(props.config.euler.x, props.config.euler.y, props.config.euler.z)
			}
			if (props.config.position3d) {
				this.handle.position3d.x = props.config.position3d.x || 0
				this.handle.position3d.y = props.config.position3d.y || 0
				this.handle.position3d.z = props.config.position3d.z
			}
			if (props.config.scale3d) {
				this.handle.scale3d.x = props.config.scale3d.x || 1
				this.handle.scale3d.y = props.config.scale3d.y || 1
				this.handle.scale3d.z = props.config.scale3d.z
			}
		}
	}

	public get euler() {
		return this.handle.euler
	}

	public get position3d() {
		return this.handle.position3d
	}

	public get scale3d() {
		return this.handle.scale3d
	}
}

export default Container3dElement

declare module "../ElementTypes" {
	export interface ElementTypes {
		"container-3d": {config: Container3dElementConfig, element: Container3dElement}
	}
}
