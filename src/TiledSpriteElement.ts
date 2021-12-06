import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig<T extends TiledSpriteElement = TiledSpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	tint?: number
}

export class TiledSpriteElement extends BaseElement {
	declare public readonly handle: TilingSprite

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-tiled", props => new this(props, new TilingSprite(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<TiledSpriteElementConfig<any>>, handle: TilingSprite) {
		super(props, handle)
		const config = props.config
		if (config) {
			if (config.tint !== undefined) {
				this.handle.tint = config.tint
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

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.anchor.set(this.pivot[0], this.pivot[1])
		this.handle.width = this.innerWidth
		this.handle.height = this.innerHeight
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
		"sprite-tiled": {config: TiledSpriteElementConfig, element: TiledSpriteElement}
	}
}
