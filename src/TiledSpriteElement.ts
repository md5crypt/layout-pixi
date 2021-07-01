import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig extends BaseConfig {
	image?: Texture | string
	tint?: number
}

export class TiledSpriteElement extends BaseElement {
	public readonly handle!: TilingSprite

	constructor(name?: string, config?: TiledSpriteElementConfig) {
		super(new TilingSprite(BaseElement.resolveAsset(config?.image)), "sprite-tiled", name, config)
		this.handle.anchor.set(0.5, 0.5)
		if (config) {
			(config.tint !== undefined) && (this.handle.tint = config.tint)
		}
	}

	public set image(value: Texture | null | string) {
		const texture = BaseElement.resolveAsset(value)
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
		this.handle.position.set(this.computedLeft, this.computedTop)
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

layoutFactory.register("sprite-tiled", (name, config) => new TiledSpriteElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-tiled": {config: TiledSpriteElementConfig, element: TiledSpriteElement}
	}
}
