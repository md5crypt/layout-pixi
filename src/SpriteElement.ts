import { BaseElement, BaseConfig, BaseConstructorProperties, BlendMode } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { Rectangle, groupD8 } from "@pixi/math"
import { Sprite } from "@pixi/sprite"

type ScalingType = "none" | "clipped" | "contain" | "stretch" | "cover" | "cover-vertical" | "cover-horizontal"

export interface SpriteElementConfig<T extends SpriteElement = SpriteElement> extends BaseConfig<T> {
	image?: Texture | string
	scaling?: ScalingType
	verticalAlign?: "top" | "middle" | "bottom"
	horizontalAlign?: "left" | "center" | "right"
	tint?: number
	roundPixels?: boolean
	blendMode?: BlendMode
}

export class SpriteElement<T extends SpriteElement = any> extends BaseElement<T> {
	declare public readonly handle: Sprite
	private _scaling: ScalingType
	private texture: Texture
	private _verticalAlign: "top" | "middle" | "bottom"
	private _horizontalAlign: "left" | "center" | "right"

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite", props => new this(props, new Sprite(props.factory.resolveAsset(props.config?.image))))
	}

	protected constructor(props: BaseConstructorProperties<SpriteElementConfig<any>>, handle: Sprite) {
		super(props, handle)
		this.texture = this.handle.texture
		this._scaling = "none"
		this._horizontalAlign = "left"
		this._verticalAlign = "top"
		const config = props.config
		if (config) {
			if (config.tint !== undefined) {
				this.handle.tint = config.tint
			}
			if (config.scaling) {
				this._scaling = config.scaling
			}
			if (config.horizontalAlign) {
				this._horizontalAlign = config.horizontalAlign
			}
			if (config.verticalAlign) {
				this._verticalAlign = config.verticalAlign
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
		return this.texture
	}

	public set image(value: Texture | string | null) {
		const texture = this.factory.resolveAsset(value)
		if (this.texture != texture) {
			this.texture = texture
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

	public get verticalAlign() {
		return this._verticalAlign
	}

	public set verticalAlign(value: "top" | "middle" | "bottom") {
		this._verticalAlign = value
		this.setDirty()
	}

	public get horizontalAlign() {
		return this._horizontalAlign
	}

	public set horizontalAlign(value: "left" | "center" | "right") {
		this._horizontalAlign = value
		this.setDirty()
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	public setTextureScale(value: number) {
		this.width = this.texture.width * value
		this.height = this.texture.height * value
	}

	public crop(rect: number[] | null, setDirty = true) {
		const texture = this.texture
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

	protected onUpdate() {
		super.onUpdate()
		let left = this.computedLeft
		let top = this.computedTop
		if (this.handle.texture != this.texture) {
			this.handle.texture = this.texture
		}
		let scale = [1, 1]
		const innerWidth = this.innerWidth
		const innerHeight = this.innerHeight
		switch (this._scaling) {
			case "stretch":
				scale[0] = innerWidth / this.texture.width
				scale[1] = innerHeight / this.texture.height
				break
			case "contain":
			case "cover":
			case "cover-vertical":
			case "cover-horizontal": {
				const elementRatio = innerWidth / innerHeight
				const textureWidth = this.texture.width
				const textureHeight = this.texture.height
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
						if (this._verticalAlign == "top") {
							top -= (innerHeight - height) / 2
						} else if (this._verticalAlign == "bottom") {
							top += (innerHeight - height) / 2
						}
					} else {
						const width = innerHeight * textureRatio
						scale[0] = width / textureWidth
						scale[1] = scale[0]
						if (this._horizontalAlign == "left") {
							left -= (innerWidth - width) / 2
						} else if (this._horizontalAlign == "right") {
							left += (innerWidth - width) / 2
						}
					}
				} else {
					if (elementRatio < textureRatio) {
						const diff = textureWidth - (textureHeight * elementRatio)
						scale[0] = innerHeight / textureHeight
						scale[1] = scale[0]
						if (this._horizontalAlign == "left") {
							this.crop([0, 0, diff, 0], false)
						} else if (this._horizontalAlign == "center") {
							this.crop([diff / 2, 0, diff / 2, 0], false)
						} else {
							this.crop([diff, 0, 0, 0], false)
						}
					} else {
						const diff = textureHeight - (textureWidth / elementRatio)
						scale[0] = innerWidth / textureWidth
						scale[1] = scale[0]
						if (this._verticalAlign == "top") {
							this.crop([0, 0, 0, diff], false)
						} else if (this._verticalAlign == "middle") {
							this.crop([0, diff / 2, 0, diff / 2], false)
						} else {
							this.crop([0, diff, 0, 0], false)
						}
					}
				}
				break
			}
			case "clipped": {
				const textureWidth = this.texture.width
				let crop = false
				let xCrop = [0, 0]
				if (innerWidth < textureWidth) {
					crop = true
					if (this._horizontalAlign == "left") {
						xCrop[1] = textureWidth - innerWidth
					} else if (this._horizontalAlign == "center") {
						xCrop[0] = (textureWidth - innerWidth) / 2
						xCrop[1] = xCrop[0]
					} else {
						xCrop[0] = textureWidth - innerWidth
					}
				} else {
					if (this._horizontalAlign == "left") {
						left -= (innerWidth - textureWidth) / 2
					} else if (this._horizontalAlign == "right") {
						left += (innerWidth - textureWidth) / 2
					}
				}
				const textureHeight = this.texture.height
				let yCrop = [0, 0]
				if (innerHeight < textureHeight) {
					crop = true
					if (this._verticalAlign == "top") {
						yCrop[1] = textureHeight - innerHeight
					} else if (this._verticalAlign == "middle") {
						yCrop[0] = (textureHeight - innerHeight) / 2
						yCrop[1] = yCrop[0]
					} else {
						yCrop[0] = textureHeight - innerHeight
					}
				} else {
					if (this._verticalAlign == "top") {
						top -= (innerHeight - textureHeight) / 2
					} else if (this._verticalAlign == "bottom") {
						top += (innerHeight - textureHeight) / 2
					}
				}
				if (crop) {
					this.crop([xCrop[0], yCrop[0], xCrop[1], yCrop[1]], false)
				}
				break
			}
			default:
				if (this._verticalAlign == "top") {
					top -= (innerHeight - this.texture.height) / 2
				} else if (this._verticalAlign == "bottom") {
					top += (innerHeight - this.texture.height) / 2
				}
				if (this._horizontalAlign == "left") {
					left -= (innerWidth - this.texture.width) / 2
				} else if (this._horizontalAlign == "right") {
					left += (innerWidth - this.texture.width) / 2
				}
				break
		}
		this.handle.scale.set(scale[0] * this._scale, scale[1] * this._scale)
		this.applyFlip()
		this.handle.position.set(left, top)
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
