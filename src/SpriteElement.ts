import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { Sprite } from "@pixi/sprite"

type ScalingType = "none" | "fixed" | "stretch" | "contain"

export interface SpriteElementConfig extends BaseConfig {
	image?: Texture
	scaling?: ScalingType
	tint?: number
	crop?: number[]
}

export class SpriteElement extends BaseElement {
	public readonly handle!: Sprite
	private scaling: ScalingType
	private texture: Texture

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
		const texture = config?.image || Texture.WHITE
		super(handle || new Sprite(texture), name, config)
		this.handle.anchor.set(0.5, 0.5)
		this.texture = texture
		this.scaling = "none"
		if (config) {
			(config.tint !== undefined) && (this.handle.tint = config.tint)
			config.scaling && (this.scaling = config.scaling)
			if (config.crop) {
				this.crop(config.crop)
			}
		}
	}

	public set image(texture: Texture | null) {
		if (this.texture != texture) {
			this.texture = texture || Texture.WHITE
			this.handle.texture = this.texture
			this.setDirty()
		}
	}

	public set tint(value: number) {
		this.handle.tint = value
	}

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(
			this.config.padding.left + this.left + this.innerWidth / 2,
			this.config.padding.top + this.top + this.innerHeight / 2
		)
		switch (this.scaling) {
			case "stretch":
				this.handle.width = this.innerWidth
				this.handle.height = this.innerHeight
				break
			case "fixed":
			case "contain":
				const elementWidth = this.innerWidth
				const elementHeight = this.innerHeight
				const elementRatio = elementWidth / elementHeight
				const textureWidth = this.texture.width
				const textureHeight = this.texture.height
				const textureRatio = textureWidth / textureHeight
				if (this.scaling == "fixed") {
					if (elementRatio < textureRatio) {
						this.handle.width = elementWidth
						this.handle.height = elementWidth / textureRatio
					} else {
						this.handle.width = elementHeight * textureRatio
						this.handle.height = elementHeight
					}
				} else {
					this.handle.width = elementWidth
					this.handle.height = elementHeight
					if (elementRatio < textureRatio) {
						const diff = Math.abs((textureHeight * elementRatio) - textureWidth)
						this.crop([diff / 2, 0, diff / 2, 0])
					} else {
						const diff = Math.abs((textureWidth / elementRatio) - textureHeight)
						this.crop([0, diff / 2, 0, diff / 2])
					}
				}
				break
			default:
				break
		}
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
