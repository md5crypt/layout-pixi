import { BaseElement, BaseConfig, BaseConstructorProperties, BlendMode } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"
import { PositioningBox } from "@md5crypt/layout"
import { Texture } from "@pixi/core"
import { NineSlicePlane } from "@pixi/mesh-extras"

// @ts-ignore
class FixedNineSlicePlane extends NineSlicePlane {
	private _refresh() {
		const texture = this.texture

		const origWidth = texture.orig.width
		const origHeight = texture.orig.height

		const trim = texture.trim || {x: 0, y: 0, width: origWidth, height: origHeight}

		const trimTop = trim.y
		const trimBottom = origHeight - trim.height - trim.y

		const top = trimTop / origHeight
		const bottom = trimBottom / origHeight

		const topHeight = Math.max(this._topHeight - trimTop, 0)
		const bottomHeight = Math.max(this._bottomHeight - trimBottom, 0)

		const trimLeft = trim.x
		const trimRight = origWidth - trim.width - trim.x

		const left = trimLeft / origWidth
		const right = trimRight / origWidth

		const leftWidth = Math.max(this._leftWidth - trimLeft, 0)
		const rightWidth = Math.max(this._rightWidth - trimRight, 0)

		// @ts-ignore
		const scale = this._getMinScale()
		const vertices = this.vertices

		if (leftWidth > 0) {
			vertices[0] = vertices[8] = vertices[16] = vertices[24] = trimLeft
			vertices[2] = vertices[10] = vertices[18] = vertices[26] = trimLeft + leftWidth * scale
		} else {
			vertices[0] = vertices[8] = vertices[16] = vertices[24] = vertices[2] = vertices[10] = vertices[18] = vertices[26] = this._width * left
		}

		if (rightWidth > 0) {
			vertices[4] = vertices[12] = vertices[20] = vertices[28] = this._width - trimRight - rightWidth * scale
			vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width - trimRight
		} else {
			vertices[4] = vertices[12] = vertices[20] = vertices[28] = vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width * (1 - right)
		}

		if (topHeight > 0) {
			vertices[1] = vertices[3] = vertices[5] = vertices[7] = trimTop
			vertices[9] = vertices[11] = vertices[13] = vertices[15] = trimTop + topHeight * scale
		} else {
			vertices[1] = vertices[3] = vertices[5] = vertices[7] = vertices[9] = vertices[11] = vertices[13] = vertices[15] = this._height * top
		}

		if (bottomHeight > 0) {
			vertices[17] = vertices[19] = vertices[21] = vertices[23] = this._height - trimBottom - bottomHeight * scale
			vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height - trimBottom
		} else {
			vertices[17] = vertices[19] = vertices[21] = vertices[23] = vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height * (1 - bottom)
		}

		const uvs = this.geometry.buffers[1].data

		uvs[0] = uvs[8] = uvs[16] = uvs[24] = left
		uvs[1] = uvs[3] = uvs[5] = uvs[7] = top
		uvs[6] = uvs[14] = uvs[22] = uvs[30] = (1 - right)
		uvs[25] = uvs[27] = uvs[29] = uvs[31] = (1 - bottom)

		uvs[2] = uvs[10] = uvs[18] = uvs[26] = left + (leftWidth / origWidth)
		uvs[4] = uvs[12] = uvs[20] = uvs[28] = (1 - right) - (rightWidth / origWidth)
		uvs[9] = uvs[11] = uvs[13] = uvs[15] = top + (topHeight / origHeight)
		uvs[17] = uvs[19] = uvs[21] = uvs[23] = (1 - bottom) - (bottomHeight / origHeight)

		this.geometry.buffers[0].update()
		this.geometry.buffers[1].update()
	}
}

export interface SlicedSpriteElementConfig<T extends SlicedSpriteElement = SlicedSpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	tint?: number
	slices?: PositioningBox
	scaling?: "width" | "height" | "none"
	buttonMode?: boolean
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class SlicedSpriteElement extends BaseElement {
	declare public readonly handle: NineSlicePlane

	private _scaling: "width" | "height" | "none"

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-sliced", props => new this(
			props,
			new FixedNineSlicePlane(props.factory.resolveAsset(props.config?.image), 0, 0, 0, 0) as any as NineSlicePlane
		))
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
			if (config.buttonMode !== undefined) {
				this.handle.buttonMode = config.buttonMode
			}
			if (config.roundPixels !== undefined) {
				this.handle.roundPixels = config.roundPixels
			}
			if (config.blendMode !== undefined) {
				this.handle.blendMode = config.blendMode as number
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

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
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

	public get buttonMode() {
		return this.handle.buttonMode
	}

	public set buttonMode(value: boolean) {
		this.handle.buttonMode = value
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
		this.applyFlip()
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
