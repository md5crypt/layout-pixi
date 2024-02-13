import { BaseTexture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"

import { ParticleContainer } from "./particles/ParticleContainer.js"

export interface ParticleContainerElementConfig extends BaseElementConfig<"container-particle", ParticleContainerElement> {
	blendMode?: BlendMode
	baseTexture?: string | BaseTexture
}

export class ParticleContainerElement extends BaseElement<ParticleContainer> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("container-particle", config => new this(factory, config))
	}

	private constructor(factory: PixiLayoutFactory, config: ParticleContainerElementConfig) {
		super(factory, config, new ParticleContainer())
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
		if (config.baseTexture) {
			this.baseTexture = config.baseTexture
		}
	}

	protected onUpdate() {
		const width = this.computedWidth
		const height = this.computedHeight
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.position.set(this.pivotLeft, this.pivotTop)
		this.handle.pivot.set(width * this._xPivot, height * this._yPivot)
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
		"container-particle": ParticleContainerElementConfig
	}
}
