import { BaseElementConfig, BlendMode } from "./BaseElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"
import { PositioningBox } from "@md5crypt/layout"
import { Texture } from "@pixi/core"
import { SpriteElement } from "./SpriteElement.js"
import { SpriteSliced } from "./9slice/index.js"

export interface SlicedSpriteElementConfig extends BaseElementConfig<"sprite-sliced", SlicedSpriteElement> {
	image?: Texture | string
	tint?: number
	slices?: PositioningBox
	scaling?: "width" | "height" | "none"
	roundPixels?: boolean
	blendMode?: BlendMode
}

// @depreciated
export class SlicedSpriteElement extends SpriteElement {
	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite-sliced", config => new this(factory, config, new SpriteSliced(factory.resolveAsset(config.image))))
	}

	protected constructor(factory: PixiLayoutFactory, config: SlicedSpriteElementConfig, handle: SpriteSliced) {
		super(factory, config as any, handle)
		this.scaling = super.scaling
	}

	public set scaling(value: any) {
		if (value == "height") {
			super.scaling = "sliced-horizontal"
		} else if (value == "width") {
			super.scaling = "sliced-vertical"
		} else {
			super.scaling = "sliced"
		}
	}

	public get scaling() {
		if (super.scaling == "sliced-horizontal") {
			return "width"
		} else if (super.scaling == "sliced-vertical") {
			return "height"
		} else {
			return "none"
		}
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-sliced": SlicedSpriteElementConfig
	}
}
