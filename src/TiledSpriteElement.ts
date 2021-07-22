import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { TilingSprite } from "@pixi/sprite-tiling"

export interface TiledSpriteElementConfig extends BaseConfig {
	image?: Texture | string
	tint?: number
}

export class TiledSpriteElement extends BaseElement {
	declare public readonly handle: TilingSprite

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-tiled", (factory, name, config) => new this({
			factory,
			name,
			config,
			type: "sprite-tiled",
			handle: new TilingSprite(factory.resolveAsset(config?.image))
		}))
	}

	protected constructor(props: BaseConstructorProperties<TiledSpriteElementConfig>) {
		super(props)
		this.handle.anchor.set(0.5, 0.5)
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

export default TiledSpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-tiled": {config: TiledSpriteElementConfig, element: TiledSpriteElement}
	}
}
