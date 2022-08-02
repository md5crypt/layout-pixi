import { BaseTexture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { BaseElement, BaseConstructorProperties, BaseConfig, BlendMode } from "./BaseElement.js"
import type LayoutFactory from "./LayoutFactory.js"

import { ParticleContainer } from "./particles/ParticleContainer.js"

export interface ParticleContainerElementConfig<T extends BaseElement = ParticleContainerElement> extends BaseConfig<T> {
	blendMode?: BlendMode
	baseTexture?: string | BaseTexture
}

export class ParticleContainerElement extends BaseElement<ParticleContainerElement> {
	declare public handle: ParticleContainer

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container-particle", props => new this(props, new ParticleContainer()))
	}

	constructor(props: BaseConstructorProperties<ParticleContainerElementConfig>, handle: ParticleContainer) {
		super(props, handle)
		const config = props.config
		if (config) {
			if (config.blendMode !== undefined) {
				this.handle.blendMode = config.blendMode as number
			}
			if (config.baseTexture) {
				this.baseTexture = config.baseTexture
			}
		}
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.width * this.pivot[0], this.height * this.pivot[1])
		this.handle.scale.set(this._scale)
		this.applyFlip()
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	public get baseTexture(): BaseTexture {
		return this.handle.baseTexture
	}

	public set baseTexture(value: BaseTexture | string) {
		this.handle.baseTexture = typeof value == "string" ? this.factory.resolveAsset(value).baseTexture : value
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"container-particle": {config: ParticleContainerElementConfig, element: ParticleContainerElement}
	}
}
