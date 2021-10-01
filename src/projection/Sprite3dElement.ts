import { SpriteElement, SpriteElementConfig } from "../SpriteElement.js"
import { BaseConstructorProperties } from "../BaseElement.js"

import type LayoutFactory from "../LayoutFactory.js"

import { Sprite3d } from "pixi-projection"

export interface Sprite3dElementConfig extends SpriteElementConfig<Sprite3dElement> {
	euler?: {x?: number, y?: number, z?: number}
	position3d?: {x?: number, y?: number, z?: number}
	scale3d?: {x?: number, y?: number, z?: number}
}

export class Sprite3dElement extends SpriteElement {
	declare public handle: Sprite3d

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-3d", props => new this(props, new Sprite3d(props.factory.resolveAsset(props.config?.image))))
	}

	constructor(props: BaseConstructorProperties<Sprite3dElementConfig>, handle: Sprite3d) {
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

	public get isFrontFace() {
		return this.handle.isFrontFace()
	}
}

export default Sprite3dElement

declare module "../ElementTypes" {
	export interface ElementTypes {
		"sprite-3d": {config: Sprite3dElementConfig, element: Sprite3dElement}
	}
}
