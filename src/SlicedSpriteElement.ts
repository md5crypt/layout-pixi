import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"
import { PositioningBox } from "@md5crypt/layout"
import { Texture } from "@pixi/core"
import { NineSlicePlane } from "@pixi/mesh-extras"

export interface SlicedSpriteElementConfig<T extends SlicedSpriteElement = SlicedSpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	tint?: number
	slices?: PositioningBox
	scaling?: "width" | "height" | "none"
}

export class SlicedSpriteElement extends BaseElement {
	declare public readonly handle: NineSlicePlane

	private _scaling: "width" | "height" | "none"

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-sliced", props => new this(props, new NineSlicePlane(props.factory.resolveAsset(props.config?.image), 0, 0, 0, 0)))
	}

	protected constructor(props: BaseConstructorProperties<SlicedSpriteElementConfig<any>>, handle: NineSlicePlane) {
		super(props, handle)
		const config = props.config
		this._scaling = "none"
		if (config) {
			if (config.tint !== undefined) {
				this.handle.tint = config.tint
			}
			if (config.slices) {
				this.setSlices(config.slices)
			}
			if (config.scaling) {
				this._scaling = config.scaling
			}
		}
	}

	public setSlices(slices: PositioningBox) {
		if (typeof slices == "number") {
			this.handle.leftWidth = slices
			this.handle.topHeight = slices
			this.handle.rightWidth = slices
			this.handle.bottomHeight = slices
		} else {
			if (slices.horizontal !== undefined) {
				this.handle.leftWidth = slices.horizontal
				this.handle.rightWidth = slices.horizontal
			} else {
				this.handle.leftWidth = slices.left || 0
				this.handle.rightWidth = slices.right || 0
			}
			if (slices.vertical !== undefined) {
				this.handle.topHeight = slices.vertical
				this.handle.bottomHeight = slices.vertical
			} else {
				this.handle.topHeight = slices.top || 0
				this.handle.bottomHeight = slices.bottom || 0
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

	public set scaling(value: "none" | "width" | "height") {
		this._scaling = value
		this.setDirty()
	}

	public get scaling() {
		return this._scaling
	}

	protected onUpdate() {
		super.onUpdate()
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
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.handle.width * this.pivot[0], this.handle.height * this.pivot[1])
	}

	public get contentHeight() {
		return this.handle.texture.height
	}

	public get contentWidth() {
		return this.handle.texture.width
	}
}

export default SlicedSpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-sliced": {config: SlicedSpriteElementConfig, element: SlicedSpriteElement}
	}
}
