import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { ContainerElement, ContainerElementConfig } from "./ContainerElement"

import { Container } from "@pixi/display"
import { Renderer, RenderTexture, AbstractRenderer } from "@pixi/core"
import { Sprite } from "@pixi/sprite"
import { Matrix } from "@pixi/math"

class CacheableContainer extends Container {
	public usePotTexture: boolean
	public passthrough: boolean

	private _sprite: Sprite
	private _texture: RenderTexture | null
	private _rendering: boolean

	constructor() {
		super()
		this._sprite = new Sprite()
		this._texture = null
		this._rendering = false
		this.usePotTexture = false
		this.passthrough = false
	}

	public render(renderer: Renderer) {
		if (this._rendering || this.passthrough) {
			return super.render(renderer)
		}
		if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
			return
		}
		this._sprite.transform.worldTransform = this.transform.worldTransform
		this._sprite.transform._worldID = this.transform._worldID
		this._sprite.worldAlpha = this.worldAlpha
		this._sprite.render(renderer)
	}

	public destroy() {
		this._sprite.destroy()
		this._texture?.destroy()
		super.destroy()
	}

	public updateCache(renderer: Renderer) {
		this._rendering = true
		const cachedAlpha = this.alpha
		this.alpha = 1
		const bounds = this.getLocalBounds(undefined, true).clone().ceil(1)
		const targetWidth = this.usePotTexture ? 1 << Math.ceil(Math.log2(bounds.width)) : bounds.width
		const targetHeight = this.usePotTexture ? 1 << Math.ceil(Math.log2(bounds.height)) : bounds.height
		let texture = this._texture
		if (!texture || texture.width != targetWidth || texture.height != targetHeight) {
			if (texture) {
				texture.destroy()
			}
			texture = RenderTexture.create({width: targetWidth, height: targetHeight, resolution: 1})
			this._texture = texture
		}
		const matrix = new Matrix()
		this.transform.localTransform.copyTo(matrix).invert().translate(-bounds.x, -bounds.y)
		this._sprite.anchor.set(
			-(bounds.x / targetWidth),
			-(bounds.y / targetHeight)
		)
		this._sprite.transform.updateLocalTransform()
		renderer.render(this, { renderTexture: texture, clear: true, transform: matrix, skipUpdateTransform: false })
		this.alpha = cachedAlpha
		this._sprite.texture = texture
		this._rendering = false
	}
}

export interface CacheableContainerElementConfig extends ContainerElementConfig<"container-cacheable", CacheableContainerElement> {
	usePotTexture?: boolean
	passthrough?: boolean
	renderer?: AbstractRenderer
}

export class CacheableContainerElement extends ContainerElement<CacheableContainer> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("container-cacheable", props => new this(factory, props))
	}

	private _cacheDirty = false
	private _renderer: Renderer | null

	private constructor(factory: PixiLayoutFactory, config: CacheableContainerElementConfig) {
		super(factory, config, new CacheableContainer())
		this._cacheDirty = false
		this._renderer = null
		if (config.renderer) {
			this._renderer = config.renderer as Renderer
		}
		if (config.passthrough !== undefined) {
			this.handle.passthrough = config.passthrough
		}
		if (config.usePotTexture !== undefined) {
			this.handle.usePotTexture = config.usePotTexture
		}
	}


	public invalidate() {
		this.setDirty()
		this._cacheDirty = true
	}

	public onUpdate() {
		super.onUpdate()
		if (this._cacheDirty && !this.handle.passthrough) {
			if (this._renderer) {
				this.handle.updateCache(this._renderer)
			} else {
				console.warn("CacheableContainerElement's renderer prop not set!")
			}
			this._cacheDirty = false
		}
	}

	public get renderer() {
		return this._renderer
	}

	public set renderer(value: AbstractRenderer | null) {
		this._renderer = value as Renderer
	}

	public get passthrough() {
		return this.handle.passthrough
	}

	public set passthrough(value: boolean) {
		this.handle.passthrough = value
	}

	public get usePotTexture() {
		return this.handle.usePotTexture
	}

	public set usePotTexture(value: boolean) {
		this.handle.usePotTexture = value
	}
}

export default CacheableContainerElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"container-cacheable": CacheableContainerElementConfig
	}
}
