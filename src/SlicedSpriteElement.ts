import { BaseConfig, BaseConstructorProperties, BlendMode } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"
import { PositioningBox } from "@md5crypt/layout"
import { Texture } from "@pixi/core"
import { SpriteElement } from "./SpriteElement.js"
import { SpriteSliced } from "./9slice/index.js"

export interface SlicedSpriteElementConfig<T extends SlicedSpriteElement = SlicedSpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	tint?: number
	slices?: PositioningBox
	scaling?: "width" | "height" | "none"
	roundPixels?: boolean
	blendMode?: BlendMode
}

// @depreciated
export class SlicedSpriteElement extends SpriteElement {
	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-sliced", props => new this(props, new SpriteSliced(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<SlicedSpriteElementConfig<any>>, handle: SpriteSliced) {
		super(props as any, handle)
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

export default SlicedSpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-sliced": {config: SlicedSpriteElementConfig, element: SlicedSpriteElement}
	}
}
