import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"
import { PositioningBox } from "@md5crypt/layout"
import { Texture } from "@pixi/core"
import { NineSlicePlane } from "@pixi/mesh-extras"

export interface SlicedSpriteElementConfig extends BaseConfig {
	image?: Texture | string
	tint?: number
	slices?: PositioningBox
}

export class SlicedSpriteElement extends BaseElement {
	declare public readonly handle: NineSlicePlane

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-sliced", (factory, name, config) => new this({
			factory,
			name,
			config,
			type: "sprite-sliced",
			handle: new NineSlicePlane(factory.resolveAsset(config?.image), 0, 0, 0, 0)
		}))
	}

	protected constructor(props: BaseConstructorProperties<SlicedSpriteElementConfig>) {
		super(props)
		const config = props.config
		if (config) {
			if (config.tint !== undefined) {
				this.handle.tint = config.tint
			}
			if (config.slices) {
				this.setSlices(config.slices)
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

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.innerWidth / 2, this.innerHeight / 2)
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

export default SlicedSpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-sliced": {config: SlicedSpriteElementConfig, element: SlicedSpriteElement}
	}
}
