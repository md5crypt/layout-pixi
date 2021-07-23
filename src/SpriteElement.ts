import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import { LayoutFactory } from "./LayoutFactory.js"

import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { Sprite } from "@pixi/sprite"

type ScalingType = "none" | "clipped" | "contain" | "stretch" | "cover"

export interface SpriteElementConfig extends BaseConfig {
	image?: Texture | string
	scaling?: ScalingType
	verticalAlign?: "top" | "middle" | "bottom"
	horizontalAlign?: "left" | "center" | "right"
	tint?: number
}

export class SpriteElement extends BaseElement {
	declare public readonly handle: Sprite
	private _scaling: ScalingType
	private texture: Texture
	private _verticalAlign: "top" | "middle" | "bottom"
	private _horizontalAlign: "left" | "center" | "right"

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite", (factory, name, config) => new this({
			factory,
			name,
			config,
			type: "sprite",
			handle: new Sprite(factory.resolveAsset(config?.image))
		}))
	}

	protected constructor(props: BaseConstructorProperties<SpriteElementConfig>) {
		super(props)
		this.handle.anchor.set(0.5, 0.5)
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

	protected crop(rect: number[]) {
		const texture = this.texture
		if (texture.noFrame) {
			this.handle.texture = new Texture(
				texture.baseTexture,
				new Rectangle(
					rect[0],
					rect[1],
					texture.orig.width - rect[0] - rect[2],
					texture.orig.height - rect[1] - rect[3]
				)
			)
		} else {
			this.handle.texture = new Texture(
				texture.baseTexture,
				new Rectangle(
					texture.frame.x + rect[0],
					texture.frame.y + rect[1],
					texture.frame.width - rect[0] - rect[2],
					texture.frame.height - rect[1] - rect[3]
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
				)
			)
		}
	}

	protected onUpdate() {
		super.onUpdate()
		let left = this.computedLeft
		let top = this.computedTop
		if (this.handle.texture != this.texture) {
			this.handle.texture = this.texture
		}
		this.handle.scale.set(1)
		switch (this._scaling) {
			case "stretch":
				this.handle.width = this.innerWidth
				this.handle.height = this.innerHeight
				break
			case "contain":
			case "cover": {
				const elementWidth = this.innerWidth
				const elementHeight = this.innerHeight
				const elementRatio = elementWidth / elementHeight
				const textureWidth = this.texture.width
				const textureHeight = this.texture.height
				const textureRatio = textureWidth / textureHeight
				if (this._scaling == "contain") {
					if (elementRatio < textureRatio) {
						const height = elementWidth / textureRatio
						this.handle.scale.set(height / textureHeight)
						if (this._verticalAlign == "top") {
							top -= (elementHeight - height) / 2
						} else if (this._verticalAlign == "bottom") {
							top += (elementHeight - height) / 2
						}
					} else {
						const width = elementHeight * textureRatio
						this.handle.scale.set(width / textureWidth)
						if (this._horizontalAlign == "left") {
							left -= (elementWidth - width) / 2
						} else if (this._horizontalAlign == "right") {
							left += (elementWidth - width) / 2
						}
					}
				} else {
					if (elementRatio < textureRatio) {
						const diff = textureWidth - (textureHeight * elementRatio)
						this.handle.scale.set(elementHeight / textureHeight)
						if (this._horizontalAlign == "left") {
							this.crop([0, 0, diff, 0])
						} else if (this._horizontalAlign == "center") {
							this.crop([diff / 2, 0, diff / 2, 0])
						} else {
							this.crop([diff, 0, 0, 0])
						}
					} else {
						const diff = textureHeight - (textureWidth / elementRatio)
						this.handle.scale.set(elementWidth / textureWidth)
						if (this._verticalAlign == "top") {
							this.crop([0, 0, 0, diff])
						} else if (this._verticalAlign == "middle") {
							this.crop([0, diff / 2, 0, diff / 2])
						} else {
							this.crop([0, diff, 0, 0])
						}
					}
				}
				break
			}
			case "clipped": {
				const elementWidth = this.innerWidth
				const textureWidth = this.texture.width
				let crop = false
				let xCrop = [0, 0]
				if (elementWidth < textureWidth) {
					crop = true
					if (this._horizontalAlign == "left") {
						xCrop[1] = textureWidth - elementWidth
					} else if (this._horizontalAlign == "center") {
						xCrop[0] = (textureWidth - elementWidth) / 2
						xCrop[1] = xCrop[0]
					} else {
						xCrop[0] = textureWidth - elementWidth
					}
				} else {
					if (this._horizontalAlign == "left") {
						left -= (elementWidth - textureWidth) / 2
					} else if (this._horizontalAlign == "right") {
						left += (elementWidth - textureWidth) / 2
					}
				}
				const elementHeight = this.innerHeight
				const textureHeight = this.texture.height
				let yCrop = [0, 0]
				if (elementHeight < textureHeight) {
					crop = true
					if (this._verticalAlign == "top") {
						yCrop[1] = textureHeight - elementHeight
					} else if (this._verticalAlign == "middle") {
						yCrop[0] = (textureHeight - elementHeight) / 2
						yCrop[1] = yCrop[0]
					} else {
						yCrop[0] = textureHeight - elementHeight
					}
				} else {
					if (this._verticalAlign == "top") {
						top -= (elementHeight - textureHeight) / 2
					} else if (this._verticalAlign == "bottom") {
						top += (elementHeight - textureHeight) / 2
					}
				}
				if (crop) {
					this.crop([xCrop[0], yCrop[0], xCrop[1], yCrop[1]])
				}
				break
			}
			default:
				if (this._verticalAlign == "top") {
					top -= (this.innerHeight - this.texture.height) / 2
				} else if (this._verticalAlign == "bottom") {
					top += (this.innerHeight - this.texture.height) / 2
				}
				if (this._horizontalAlign == "left") {
					left -= (this.innerWidth - this.texture.width) / 2
				} else if (this._horizontalAlign == "right") {
					left += (this.innerWidth - this.texture.width) / 2
				}
				break
		}
		this.handle.position.set(left, top)
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
