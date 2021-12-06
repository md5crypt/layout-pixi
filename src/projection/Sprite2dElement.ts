import { SpriteElement, SpriteElementConfig } from "../SpriteElement.js"
import { BaseConstructorProperties } from "../BaseElement.js"

import type LayoutFactory from "../LayoutFactory.js"

import { Sprite2d } from "pixi-projection"

export interface Sprite2dElementConfig extends SpriteElementConfig<Sprite2dElement> {
}

export class Sprite2dElement extends SpriteElement {
	declare public handle: Sprite2d

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-2d", props => new this(props, new Sprite2d(props.factory.resolveAsset(props.config?.image))))
	}

	constructor(props: BaseConstructorProperties<Sprite2dElementConfig>, handle: Sprite2d) {
		super(props, handle)
	}

	public updateProjection(quad: {x: number, y: number}[]) {
		this.handle.proj.mapSprite(this.handle, quad)
	}
}

export default Sprite2dElement

declare module "../ElementTypes" {
	export interface ElementTypes {
		"sprite-2d": {config: Sprite2dElementConfig, element: Sprite2dElement}
	}
}
