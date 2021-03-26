import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

import { Texture } from "@pixi/core"
import { NineSlicePlane } from "@pixi/mesh-extras"

export interface SlicedSpriteElementConfig extends BaseConfig {
	image?: Texture
	tint?: number
	slices?: number[]
}

export class SlicedSpriteElement extends BaseElement {
	public readonly handle!: NineSlicePlane

	constructor(name?: string, config?: SlicedSpriteElementConfig) {
		super(new NineSlicePlane(config?.image || Texture.WHITE, ...(config?.slices ?? [])), name, config)
		if (config) {
			(config.tint !== undefined) && (this.handle.tint = config.tint)
		}
	}

	public set image(value: Texture | null) {
		const texture = value || Texture.WHITE
		if (this.handle.texture != texture) {
			this.handle.texture = texture
			this.setDirty()
		}
	}

	public set tint(value: number) {
		this.handle.tint = value
	}

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(
			this.config.padding.left + this.left + this.innerWidth / 2,
			this.config.padding.top + this.top + this.innerHeight / 2
		)
		this.handle.pivot.set(this.innerWidth / 2, this.innerHeight / 2)
		this.handle.width = this.innerWidth
		this.handle.height = this.innerHeight
	}

	public get contentHeight() {
		return this.handle.texture.height
	}

	public get contentWidth() {
		return this.handle.texture.width
	}
}

layoutFactory.register("sprite-sliced", (name, config) => new SlicedSpriteElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-sliced": {config: SlicedSpriteElementConfig, element: SlicedSpriteElement}
	}
}
