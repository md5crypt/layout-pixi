import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig<T extends TiledSpriteElement = TiledSpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	tint?: number
	scaling?: "width" | "height" | "none"
	clampMargin?: number
	roundPixels?: boolean
}

export class TiledSpriteElement extends BaseElement {
	declare public readonly handle: TilingSprite

	private _scaling: "width" | "height" | "none"

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-tiled", props => new this(props, new TilingSprite(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<TiledSpriteElementConfig<any>>, handle: TilingSprite) {
		super(props, handle)
		const config = props.config
		this._scaling = "none"
		if (config) {
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
		super.onUpdate()
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.anchor.set(this.pivot[0], this.pivot[1])
		let scale = 1
		if (this.scaling == "width") {
			scale = this.innerWidth / this.handle.texture.width
			this.handle.scale.set(scale * this._scale)
			this.handle.width = this.handle.texture.width
			this.handle.height = this.innerHeight / scale
		} else if (this.scaling == "height") {
			scale = this.innerHeight / this.handle.texture.height
			this.handle.scale.set(scale * this._scale)
			this.handle.width = this.innerWidth / scale
			this.handle.height = this.handle.texture.height
		} else {
			this.handle.scale.set(this._scale)
			this.handle.width = this.innerWidth
			this.handle.height = this.innerHeight
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
		"sprite-tiled": {config: TiledSpriteElementConfig, element: TiledSpriteElement}
	}
}
