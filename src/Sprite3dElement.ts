
import type LayoutFactory from "./LayoutFactory.js"

import { Sprite3d } from "./projection/proj3d/Sprite3d.js"
import { Rectangle } from "@pixi/math"
import { Texture } from "@pixi/core"
import { BaseElement, BaseConfig, BlendMode, BaseConstructorProperties } from "./BaseElement.js"

export interface Sprite3dElementConfig<T extends Sprite3dElement = Sprite3dElement> extends BaseConfig<T> {
	image?: Texture | string
	backImage?: Texture | string
	tint?: number
	blendMode?: BlendMode
}

export class Sprite3dElement<T extends Sprite3dElement = any> extends BaseElement<T> {
	declare public handle: Sprite3d

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-3d", props => new this(props, new Sprite3d(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<Sprite3dElementConfig<any>>, handle: Sprite3d) {
		super(props, handle)
		handle.anchor.set(0, 0)
		const config = props.config
		if (config) {
			if (config.tint !== undefined) {
				this.handle.tint = config.tint
			}
			if (config.blendMode !== undefined) {
				this.handle.blendMode = config.blendMode as number
			}
			if (config.backImage) {
				this.handle.backTexture = props.factory.resolveAsset(config.backImage)
			}
		}
	}

	protected onUpdate() {
		super.onUpdate()
		const innerWidth = this.innerWidth
		const innerHeight = this.innerHeight
		const texture = this.handle.texture
		this.handle.scale.set(innerWidth / texture.width * this._scale, innerHeight / texture.height * this._scale)
		this.applyFlip()
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(innerWidth * this._xPivot, innerHeight * this._yPivot)
		if (this.handle.interactive) {
			const width = this.width
			const height = this.height
			this.handle.hitArea = new Rectangle(0, 0, width, height)
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
		"sprite-3d": {config: Sprite3dElementConfig, element: Sprite3dElement}
	}
}
