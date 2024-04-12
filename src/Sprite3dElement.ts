
import type { PixiLayoutFactory } from "./PixiLayoutFactory"

import { BackTextureTransform, Sprite3d } from "./projection/proj3d/Sprite3d"
import { Rectangle } from "@pixi/math"
import { Texture } from "@pixi/core"
import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"

export interface Sprite3dElementConfig extends BaseElementConfig<"sprite-3d", Sprite3dElement> {
	image?: Texture | string
	backImage?: Texture | string
	tint?: number
	blendMode?: BlendMode
	mirrorBackImage?: "vertical" | "horizontal"
}

export class Sprite3dElement extends BaseElement<Sprite3d> {

	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite-3d", config => new this(factory, config))
	}

	protected constructor(factory: PixiLayoutFactory, config: Sprite3dElementConfig) {
		super(factory, config, new Sprite3d(factory.resolveAsset(config.image)))
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
		}
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
		if (config.backImage) {
			this.handle.backTexture = factory.resolveAsset(config.backImage)
		}
		if (config.mirrorBackImage) {
			this.mirrorBackImage = config.mirrorBackImage
		}
	}

	protected onUpdate() {
		const computedWidth = this.computedWidth
		const computedHeight = this.computedHeight
		const texture = this.handle.texture

		const xScale = computedWidth / texture.width
		const yScale = computedHeight / texture.height

		this.handle.scale.set(xScale * this._scale, yScale * this._scale)
		this.handle.pivot.set(computedWidth * this._xPivot, computedHeight * this._yPivot)
		this.applyFlip()
		this.handle.position.set(
			this.computedLeft + this._scale * xScale * this._xPivot * this.computedWidth,
			this.computedTop + this._scale * yScale * this._yPivot * this.computedHeight
		)
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(
				0,
				0,
				texture.width,
				texture.height
			)
		}
	}

	public get contentHeight() {
		return this.handle.texture.height
	}

	public get contentWidth() {
		return this.handle.texture.width
	}

	public set interactive(value: boolean) {
		if (super.interactive != value) {
			super.interactive = value
			this.setDirty()
		}
	}

	public get interactive() {
		return super.interactive
	}

	public get image() {
		return this.handle.frontTexture
	}

	public set image(value: Texture | string | null) {
		const texture = this.factory.resolveAsset(value)
		if (this.handle.frontTexture != texture) {
			this.handle.frontTexture = texture
			this.setDirty()
		}
	}

	public get backImage() {
		return this.handle.backTexture
	}

	public set backImage(value: Texture | string | null) {
		const texture = value === null ? null : this.factory.resolveAsset(value)
		if (this.handle.backTexture != texture) {
			this.handle.backTexture = texture
			this.setDirty()
		}
	}

	public get mirrorBackImage() {
		if (this.handle.backTextureTransform) {
			return this.handle.backTextureTransform == BackTextureTransform.MIRROR_HORIZONTAL ? "horizontal" : "vertical"
		} else {
			return null
		}
	}

	public set mirrorBackImage(value: null | "vertical" | "horizontal") {
		if (value == "vertical") {
			this.handle.backTextureTransform = BackTextureTransform.MIRROR_VERTICAL
		} else if (value == "horizontal") {
			this.handle.backTextureTransform = BackTextureTransform.MIRROR_HORIZONTAL
		} else {
			this.handle.backTextureTransform = BackTextureTransform.NONE
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

	public get zScale() {
		return this.handle.transform.scale.z
	}

	public set zScale(value: number) {
		this.handle.transform.scale.z = value
	}

	public get zPosition() {
		return this.handle.transform.position.z
	}

	public set zPosition(value: number) {
		this.handle.transform.position.z = value
	}

	public get zPivot() {
		return this.handle.transform.pivot.z
	}

	public set zPivot(value: number) {
		this.handle.transform.pivot.z = value
	}

	public get euler() {
		return this.handle.transform.euler
	}
}

export default Sprite3dElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-3d": Sprite3dElementConfig
	}
}
