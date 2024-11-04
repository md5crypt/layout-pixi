import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"

import { Texture } from "@pixi/core"
import { Rectangle, groupD8 } from "@pixi/math"
import { SliceConfiguration, SpriteSliced } from "./9slice/index"

type ScalingType = (
	"none" | "clipped" | "contain" | "stretch" |
	"cover" | "cover-vertical" | "cover-horizontal" |
	"sliced" | "sliced-horizontal" | "sliced-vertical"
)
export interface SpriteElementConfig<TYPE extends string = "sprite", SELF extends SpriteElement = SpriteElement> extends BaseElementConfig<TYPE, SELF> {
	image?: Texture | string
	scaling?: ScalingType
	slices?: SliceConfiguration | number
	verticalAlign?: "top" | "middle" | "bottom"
	horizontalAlign?: "left" | "center" | "right"
	tint?: number
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class SpriteElement<HANDLE extends SpriteSliced = SpriteSliced> extends BaseElement<HANDLE> {
	private _scaling: ScalingType
	private _texture: Texture
	private _yAlign: number
	private _xAlign: number

	public static register(factory: PixiLayoutFactory) {
		factory.register("sprite", config => new this(factory, config, new SpriteSliced(factory.resolveAsset(config.image))))
	}

	protected constructor(factory: PixiLayoutFactory, config: Readonly<SpriteElementConfig<any, any>>, handle: HANDLE) {
		super(factory, config, handle)
		this._texture = this.handle.texture
		this._scaling = "none"
		this._xAlign = 0
		this._yAlign = 0

		if (config.tint !== undefined) {
			this.handle.tint = config.tint
		}
		if (config.scaling) {
			this._scaling = config.scaling
		}
		if (config.slices) {
			this.setSlices(config.slices)
		}
		if (config.horizontalAlign) {
			this.horizontalAlign = config.horizontalAlign
		}
		if (config.verticalAlign) {
			this.verticalAlign = config.verticalAlign
		}
		if (config.roundPixels !== undefined) {
			this.handle.roundPixels = config.roundPixels
		}
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}

	}

	public get image() {
		return this._texture
	}

	public set image(value: Texture | string | null) {
		const texture = this.factory.resolveAsset(value)
		if (this._texture != texture) {
			this._texture = texture
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

	public get scaling() {
		return this._scaling
	}

	public set scaling(value: ScalingType) {
		this._scaling = value
		this.setDirty()
	}

	public get yAlign() {
		return this._yAlign
	}

	public set yAlign(value: number) {
		if (this._yAlign != value) {
			this._yAlign = value
			this.setDirty()
		}
	}

	public get xAlign() {
		return this._xAlign
	}

	public set xAlign(value: number) {
		if (this._xAlign != value) {
			this._xAlign = value
			this.setDirty()
		}
	}

	public get verticalAlign() {
		if (this._yAlign == 0) {
			return "top"
		} else if (this._yAlign == 0.5) {
			return "middle"
		} else {
			return "bottom"
		}
	}

	public set verticalAlign(value: "top" | "middle" | "bottom") {
		let newValue
		if (value == "top") {
			newValue = 0
		} else if (value == "middle") {
			newValue = 0.5
		} else {
			newValue = 1
		}
		if (this._yAlign != newValue) {
			this._yAlign = newValue
			this.setDirty()
		}
	}

	public get horizontalAlign() {
		if (this._xAlign == 0) {
			return "left"
		} else if (this._xAlign == 0.5) {
			return "center"
		} else {
			return "right"
		}
	}

	public set horizontalAlign(value: "left" | "center" | "right") {
		let newValue
		if (value == "left") {
			newValue = 0
		} else if (value == "center") {
			newValue = 0.5
		} else {
			newValue = 1
		}
		if (this._xAlign != newValue) {
			this._xAlign = newValue
			this.setDirty()
		}
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	public crop(rect: number[] | null, setDirty = true) {
		const texture = this._texture
		if (rect == null) {
			this.handle.texture = texture
		} else if (texture.noFrame) {
			this.handle.texture = new Texture(
				texture.baseTexture,
				new Rectangle(
					rect[0],
					rect[1],
					texture.orig.width - rect[0] - rect[2],
					texture.orig.height - rect[1] - rect[3],
				)
			)
		} else {
			const origRect = (texture.rotate & (groupD8.S | groupD8.N)) ? [rect[1], rect[0], rect[3], rect[2]] : rect
			this.handle.texture = new Texture(
				texture.baseTexture,
				new Rectangle(
					texture.frame.x + origRect[0],
					texture.frame.y + origRect[1],
					texture.frame.width - origRect[0] - origRect[2],
					texture.frame.height - origRect[1] - origRect[3]
				),
				new Rectangle(
					0,
					0,
					texture.orig.width - rect[0] - rect[2],
					texture.orig.height - rect[1] - rect[3]
				),
				new Rectangle(
					texture.trim.x,
					texture.trim.y,
					texture.trim.width - rect[0] - rect[2],
					texture.trim.height - rect[1] - rect[3]
				),
				texture.rotate
			)
		}
		if (setDirty) {
			this.setDirty()
		}
	}

	public setSlices(slices: SliceConfiguration | number) {
		this.handle.setSliced(slices)
	}

	protected onUpdate() {
		let xOffset = 0
		let yOffset = 0
		if (this.handle.texture != this._texture) {
			this.handle.texture = this._texture
		}
		let scale = [1, 1]
		const computedWidth = this.computedWidth
		const computedHeight = this.computedHeight
		let isSliced = false
		switch (this._scaling) {
			case "stretch":
				scale[0] = computedWidth / this._texture.width
				scale[1] = computedHeight / this._texture.height
				break
			case "contain":
			case "cover":
			case "cover-vertical":
			case "cover-horizontal": {
				const elementRatio = computedWidth / computedHeight
				const textureWidth = this._texture.width
				const textureHeight = this._texture.height
				const textureRatio = textureWidth / textureHeight
				const contain = (
					this._scaling == "contain" ||
					(this._scaling == "cover-horizontal" && elementRatio < textureRatio) ||
					(this._scaling == "cover-vertical" && elementRatio > textureRatio)
				)
				if (contain) {
					if (elementRatio < textureRatio) {
						const height = computedWidth / textureRatio
						scale[0] = height / textureHeight
						scale[1] = scale[0]
						yOffset += (computedHeight - height) * this._yAlign
					} else {
						const width = computedHeight * textureRatio
						scale[0] = width / textureWidth
						scale[1] = scale[0]
						xOffset += (computedWidth - width) * this._xAlign
					}
				} else {
					if (elementRatio < textureRatio) {
						const diff = textureWidth - (textureHeight * elementRatio)
						scale[0] = computedHeight / textureHeight
						scale[1] = scale[0]
						this.crop([diff * this._xAlign, 0, diff * (1 - this._xAlign), 0], false)
					} else {
						const diff = textureHeight - (textureWidth / elementRatio)
						scale[0] = computedWidth / textureWidth
						scale[1] = scale[0]
						this.crop([0, diff * this._yAlign, 0, diff * (1 - this._yAlign)], false)
					}
				}
				break
			}
			case "clipped": {
				const textureWidth = this._texture.width
				let crop = false
				let xCrop = [0, 0]
				if (computedWidth < textureWidth) {
					crop = true
					xCrop[0] = (textureWidth - computedWidth) * this._xAlign
					xCrop[1] = (textureWidth - computedWidth) * (1 - this._xAlign)
				} else {
					xOffset += (computedWidth - textureWidth) * this._xAlign
				}
				const textureHeight = this._texture.height
				let yCrop = [0, 0]
				if (computedHeight < textureHeight) {
					crop = true
					yCrop[0] = (textureHeight - computedHeight) * this._yAlign
					yCrop[1] = (textureHeight - computedHeight) * (1 - this._yAlign)
				} else {
					yOffset += (computedHeight - textureHeight) * this._yAlign
				}
				if (crop) {
					this.crop([xCrop[0], yCrop[0], xCrop[1], yCrop[1]], false)
				}
				break
			}
			case "sliced":
				this.handle.width = computedWidth
				this.handle.height = computedHeight
				isSliced = true
				break
			case "sliced-horizontal":
				scale[0] = scale[1] = computedHeight / this._texture.height
				this.handle.width = computedWidth / scale[0]
				this.handle.height = this._texture.height
				isSliced = true
				break
			case "sliced-vertical":
				scale[0] = scale[1] = computedWidth / this._texture.width
				this.handle.width = this._texture.width
				this.handle.height = computedHeight / scale[0]
				isSliced = true
				break
			default:
				xOffset += (computedHeight - this._texture.height) * this._yAlign
				yOffset += (computedWidth - this._texture.width) * this._yAlign
				break
		}
		this.handle.isSliced = isSliced
		this.handle.scale.set(
			scale[0] * this._scale,
			scale[1] * this._scale
		)

		this.handle.pivot.set((computedWidth * this._xPivot - xOffset) / scale[0], (computedHeight * this._yPivot - yOffset) / scale[1])
		this.applyFlip()
		this.handle.position.set(
			this.computedLeft + this._scale * this._xPivot * this.computedWidth,
			this.computedTop + this._scale * this._yPivot * this.computedHeight
		)
	}

	public get contentHeight() {
		return this.handle.texture.height
	}

	public get contentWidth() {
		return this.handle.texture.width
	}
}

export default SpriteElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		sprite: SpriteElementConfig
	}
}
