
import type { PixiLayoutFactory } from "./PixiLayoutFactory"

import { Sprite3d } from "./projection/proj3d/Sprite3d"
import { Rectangle } from "@pixi/math"
import { Texture } from "@pixi/core"
import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"

export interface Sprite3dElementConfig extends BaseElementConfig<"sprite-3d", Sprite3dElement> {
	image?: Texture | string
	backImage?: Texture | string
	tint?: number
	blendMode?: BlendMode
}

export class Sprite3dElement extends BaseElement<Sprite3d> {

	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite-3d", config => new this(factory, config))
	}

	protected constructor(factory: PixiLayoutFactory, config: Sprite3dElementConfig) {
		super(factory, config, new Sprite3d(factory.resolveAsset(config.image)))
		this.handle.anchor.set(0, 0)
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
		}
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
		if (config.backImage) {
			this.handle.backTexture = factory.resolveAsset(config.backImage)
		}
	}

	protected onUpdate() {
		const computedWidth = this.computedWidth
		const computedHeight = this.computedHeight
		const texture = this.handle.texture
		this.handle.scale.set(
			computedWidth / texture.width * this._scale,
			computedHeight / texture.height * this._scale
		)
		this.applyFlip()
		this.handle.position.set(this.pivotedLeft, this.pivotedTop)
		this.handle.anchor.set(this._xPivot, this._yPivot)
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(
				this._xPivot * -texture.width,
				this._yPivot * -texture.height,
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
