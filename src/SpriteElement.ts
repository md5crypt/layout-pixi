import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"

import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"
import { Container } from "@pixi/display"
import { Sprite } from "@pixi/sprite"

type ScalingType = "none" | "fixed" | "stretch" | "contain"

export interface SpriteElementConfig extends BaseConfig {
	image?: Texture
	scaling?: ScalingType
	tint?: number
	container?: boolean
	slices?: number[]
	crop?: number[]
}

export class SpriteElement extends BaseElement {
	public readonly sprite: Sprite
	private scaling: ScalingType
	private texture: Texture

	public crop(rect: number[]) {
		const texture = this.texture
		if (texture.noFrame) {
			this.sprite.texture = new Texture(
				texture.baseTexture,
				new Rectangle(
					rect[0],
					rect[1],
					texture.orig.width - rect[0] - rect[2],
					texture.orig.height - rect[1] - rect[3]
				)
			)
		} else {
			this.sprite.texture = new Texture(
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

	constructor(name?: string, config?: SpriteElementConfig, spawner = (texture: Texture) => new Sprite(texture)) {
		let texture = config?.image || Texture.WHITE
		const sprite = spawner(texture)
		let handle: Container = sprite
		if (config?.container) {
			handle = new Container()
			sprite.zIndex = -Infinity
			handle.addChild(sprite)
		}
		super(handle, name, config)
		this.texture = texture
		this.sprite = sprite
		this.scaling = "none"
		if (config) {
			(config.tint !== undefined) && (this.sprite.tint = config.tint)
			config.scaling && (this.scaling = config.scaling)
			if (config.crop) {
				this.crop(config.crop)
			}
		}
	}

	public set image(texture: Texture | null) {
		if (this.texture != texture) {
			this.texture = texture || Texture.WHITE
			this.sprite.texture = this.texture
			this.setDirty()
		}
	}

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(this.left + this.width / 2, this.top + this.height / 2)
		if (this.handle instanceof Sprite) {
			this.handle.anchor.set(0.5, 0.5)
		} else {
			this.handle.pivot.set(this.width / 2, this.height / 2)
		}
		switch (this.scaling) {
			case "stretch":
				this.sprite.width = this.width
				this.sprite.height = this.height
				break
			case "fixed":
			case "contain":
				const elementWidth = this.width
				const elementHeight = this.height
				const elementRatio = elementWidth / elementHeight
				const textureWidth = this.texture.width
				const textureHeight = this.texture.height
				const textureRatio = textureWidth / textureHeight
				if (this.scaling == "fixed") {
					if (elementRatio < textureRatio) {
						this.sprite.width = elementWidth
						this.sprite.height = elementWidth / textureRatio
					} else {
						this.sprite.width = elementHeight * textureRatio
						this.sprite.height = elementHeight
					}
				} else {
					this.sprite.width = elementWidth
					this.sprite.height = elementHeight
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
		return this.sprite.texture.height
	}

	public get contentWidth() {
		return this.sprite.texture.width
	}
}

layoutFactory.register("sprite", (name, config) => new SpriteElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		sprite: {config: SpriteElementConfig, element: SpriteElement}
	}
}
