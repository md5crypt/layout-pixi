import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig extends BaseElementConfig<"sprite-tiled", TiledSpriteElement> {
	image?: Texture | string
	tint?: number
	clampMargin?: number
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class TiledSpriteElement extends BaseElement<TilingSprite> {

	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite-tiled", config => new this(factory, config, new TilingSprite(factory.resolveAsset(config.image))))
	}

	protected constructor(factory: PixiLayoutFactory, config: TiledSpriteElementConfig, handle: TilingSprite) {
		super(factory, config, handle)
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
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

	public set clampMargin(value: number) {
		this.handle.clampMargin = value
	}

	public get clampMargin() {
		return this.handle.clampMargin
	}

	protected onUpdate() {
		const width = this.computedWidth
		const height = this.computedHeight
		this.handle.width = width
		this.handle.height = height
		this.handle.position.set(this.pivotedLeft, this.pivotedTop)
		this.handle.pivot.set(width * this._xPivot, height * this._yPivot)
		this.handle.scale.set(this._scale)
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
