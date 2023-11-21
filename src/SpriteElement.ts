import { BaseElement, BaseConfig, BaseConstructorProperties, BlendMode } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { Rectangle, groupD8 } from "@pixi/math"
import { Sprite } from "@pixi/sprite"
import { PositioningBox } from "@md5crypt/layout"
import { SpriteSliced } from "./9slice/index.js"

type ScalingType = (
	"none" | "clipped" | "contain" | "stretch" |
	"cover" | "cover-vertical" | "cover-horizontal" |
	"sliced" | "sliced-horizontal" | "sliced-vertical"
)

export interface SpriteElementConfig<T extends SpriteElement = SpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	scaling?: ScalingType
	slices?: PositioningBox
	verticalAlign?: "top" | "middle" | "bottom"
	horizontalAlign?: "left" | "center" | "right"
	tint?: number
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class SpriteElement<T extends SpriteElement = any> extends BaseElement<T> {
	declare public readonly handle: SpriteSliced

	private _scaling: ScalingType
	private _texture: Texture
	private _yAlign: number
	private _xAlign: number

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite", props => new this(props, new SpriteSliced(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<SpriteElementConfig<any>>, handle: Sprite) {
		super(props, handle)
		this._texture = this.handle.texture
		this._scaling = "none"
		this._xAlign = 0
		this._yAlign = 0
		const config = props.config
		if (config) {
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
			this.setDirty(true)
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

	protected onUpdate() {
		super.onUpdate()
		let xOffset = 0
		let yOffset = 0
		if (this.handle.texture != this._texture) {
			this.handle.texture = this._texture
		}
		let scale = [1, 1]
		const innerWidth = this.innerWidth
		const innerHeight = this.innerHeight
		let isSliced = false
		switch (this._scaling) {
			case "stretch":
				scale[0] = innerWidth / this._texture.width
				scale[1] = innerHeight / this._texture.height
				break
			case "contain":
			case "cover":
			case "cover-vertical":
			case "cover-horizontal": {
				const elementRatio = innerWidth / innerHeight
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
						const height = innerWidth / textureRatio
						scale[0] = height / textureHeight
						scale[1] = scale[0]
						yOffset += (innerHeight - height) * (this._yAlign - this._yPivot)
					} else {
						const width = innerHeight * textureRatio
						scale[0] = width / textureWidth
						scale[1] = scale[0]
						xOffset += (innerWidth - width) * (this._xAlign - this._xPivot)
					}
				} else {
					if (elementRatio < textureRatio) {
						const diff = textureWidth - (textureHeight * elementRatio)
						scale[0] = innerHeight / textureHeight
						scale[1] = scale[0]
						this.crop([diff * this._xAlign, 0, diff * (1 - this._xAlign), 0], false)
					} else {
						const diff = textureHeight - (textureWidth / elementRatio)
						scale[0] = innerWidth / textureWidth
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
				if (innerWidth < textureWidth) {
					crop = true
					xCrop[0] = (textureWidth - innerWidth) * this._xAlign
					xCrop[1] = (textureWidth - innerWidth) * (1 - this._xAlign)
				} else {
					xOffset += (innerWidth - textureWidth) * (this._xAlign - this._xPivot)
				}
				const textureHeight = this._texture.height
				let yCrop = [0, 0]
				if (innerHeight < textureHeight) {
					crop = true
					yCrop[0] = (textureHeight - innerHeight) * this._yAlign
					yCrop[1] = (textureHeight - innerHeight) * (1 - this._yAlign)
				} else {
					yOffset += (innerHeight - textureHeight) * (this._yAlign - this._yPivot)
				}
				if (crop) {
					this.crop([xCrop[0], yCrop[0], xCrop[1], yCrop[1]], false)
				}
				break
			}
			case "sliced":
				this.handle.width = innerWidth
				this.handle.height = innerHeight
				isSliced = true
				break
			case "sliced-horizontal":
				scale[0] = scale[1] = innerHeight / this._texture.height
				this.handle.width = innerWidth / scale[0]
				this.handle.height = this._texture.height
				isSliced = true
				break
			case "sliced-vertical":
				scale[0] = scale[1] = innerWidth / this._texture.width
				this.handle.width = this._texture.width
				this.handle.height = innerHeight / scale[0]
				isSliced = true
				break
			default:
				xOffset += (innerHeight - this._texture.height) * (this._yAlign - this._yPivot)
				yOffset += (innerWidth - this._texture.width) * (this._yAlign - this._yPivot)
				break
		}
		this.handle.isSliced = isSliced
		this.handle.scale.set(
			scale[0] * this._scale,
			scale[1] * this._scale
		)
		this.applyFlip()
		this.handle.position.set(
			this.computedLeft + xOffset * this._scale,
			this.computedTop + this._scale * yOffset
		)
		this.handle.anchor.set(this._xPivot, this._yPivot)
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
		sprite: {config: SpriteElementConfig, element: SpriteElement}
	}
}
