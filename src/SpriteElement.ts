import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { Sprite } from "@pixi/sprite"

type ScalingType = "none" | "contain" | "stretch" | "cover"

export interface SpriteElementConfig extends BaseConfig {
	image?: Texture | string
	scaling?: ScalingType
	verticalAlign?: "top" | "middle" | "bottom"
	horizontalAlign?: "left" | "center" | "right"
	tint?: number
	crop?: number[]
}

export class SpriteElement extends BaseElement {
	public readonly handle!: Sprite
	private _scaling: ScalingType
	private texture: Texture
	private _verticalAlign: "top" | "middle" | "bottom"
	private _horizontalAlign: "left" | "center" | "right"

	public crop(rect: number[]) {
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
					texture.trim.x + rect[0],
					texture.trim.y + rect[1],
					texture.trim.width - rect[0] - rect[2],
					texture.trim.height - rect[1] - rect[3]
				)
			)
		}
	}

	constructor(name?: string, config?: SpriteElementConfig, handle?: Sprite) {
		const texture = BaseElement.resolveAsset(config?.image)
		super(handle || new Sprite(texture), "sprite", name, config)
		this.handle.anchor.set(0.5, 0.5)
		this.texture = texture
		this._scaling = "none"
		this._horizontalAlign = "left"
		this._verticalAlign = "top"
		if (config) {
			(config.tint !== undefined) && (this.handle.tint = config.tint)
			config.scaling && (this._scaling = config.scaling)
			config.horizontalAlign && (this._horizontalAlign = config.horizontalAlign)
			config.verticalAlign && (this._verticalAlign = config.verticalAlign)
			if (config.crop) {
				this.crop(config.crop)
			}
		}
	}

	public set image(value: Texture | null | string) {
		const texture = BaseElement.resolveAsset(value)
		if (this.texture != texture) {
			this.texture = texture
			this.handle.texture = this.texture
			this.setDirty()
		}
	}

	public set tint(value: number) {
		this.handle.tint = value
	}

	public set scaling(value: ScalingType) {
		this._scaling = value
		this.handle.texture = this.texture
		this.setDirty()
	}

	public set verticalAlign(value: "top" | "middle" | "bottom") {
		this._verticalAlign = value
		this.handle.texture = this.texture
		this.setDirty()
	}

	public set horizontalAlign(value: "left" | "center" | "right") {
		this._horizontalAlign = value
		this.handle.texture = this.texture
		this.setDirty()
	}

	protected onUpdate() {
		super.onUpdate()
		let left = this.computedLeft
		let top = this.computedTop
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
			} default:
				this.handle.scale.set(1)
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

layoutFactory.register("sprite", (name, config) => new SpriteElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		sprite: {config: SpriteElementConfig, element: SpriteElement}
	}
}
