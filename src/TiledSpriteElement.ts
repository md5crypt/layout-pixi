import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig extends BaseElementConfig<"sprite-tiled", TiledSpriteElement> {
	image?: Texture | string
	tint?: number
	scaling?: "width" | "height" | "none"
	clampMargin?: number
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class TiledSpriteElement extends BaseElement<TilingSprite> {
	private _scaling: "width" | "height" | "none"

	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite-tiled", config => new this(factory, config, new TilingSprite(factory.resolveAsset(config.image))))
	}

	protected constructor(factory: PixiLayoutFactory, config: TiledSpriteElementConfig, handle: TilingSprite) {
		super(factory, config, handle)
		this._scaling = "none"
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
		}
		if (config.scaling) {
			this._scaling = config.scaling
		}
		if (config.clampMargin !== undefined) {
			this.clampMargin = config.clampMargin
		}
		if (config.roundPixels !== undefined) {
			this.handle.roundPixels = config.roundPixels
		}
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
	}

	public get image(): Texture {
		return this.handle.texture
	}

	public set image(value: Texture | string | null) {
		const texture = this.factory.resolveAsset(value)
		if (this.handle.texture != texture) {
			this.handle.texture = texture
			this.setDirty()
		}
	}

	public get tint() {
		return this.handle.tint
	}

	public set tint(value: number) {
		this.handle.tint = value
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	public get roundPixels() {
		return this.handle.roundPixels
	}

	public set roundPixels(value: boolean) {
		this.handle.roundPixels = value
	}

	public set scaling(value: "none" | "width" | "height") {
		this._scaling = value
		this.setDirty()
	}

	public get scaling() {
		return this._scaling
	}

	public set clampMargin(value: number) {
		this.handle.clampMargin = value
	}

	public get clampMargin() {
		return this.handle.clampMargin
	}

	protected onUpdate() {
		this.handle.position.set(this.pivotedLeft, this.pivotedTop)
		this.handle.anchor.set(this._xPivot, this._yPivot)
		let scale = 1
		if (this.scaling == "width") {
			scale = this.computedWidth / this.handle.texture.width
			this.handle.scale.set(scale * this._scale)
			this.handle.width = this.handle.texture.width
			this.handle.height = this.computedHeight / scale
		} else if (this.scaling == "height") {
			scale = this.computedHeight / this.handle.texture.height
			this.handle.scale.set(scale * this._scale)
			this.handle.width = this.computedWidth / scale
			this.handle.height = this.handle.texture.height
		} else {
			this.handle.scale.set(this._scale)
			this.handle.width = this.computedWidth
			this.handle.height = this.computedHeight
		}
		this.applyFlip()
	}

	public get contentHeight() {
		return this.handle.texture.height
	}

	public get contentWidth() {
		return this.handle.texture.width
	}
}

export default TiledSpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-tiled": TiledSpriteElementConfig
	}
}
