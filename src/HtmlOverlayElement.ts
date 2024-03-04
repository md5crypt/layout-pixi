import { BaseElement, BaseElementConfig } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { HtmlOverlay } from "./htmlOverlay/index"
import { Rectangle } from "@pixi/math"
import { Renderer } from "@pixi/core"

export interface HtmlOverlayElementConfig extends BaseElementConfig<"html", HtmlOverlayElement> {
	style?: string
	content?: string
	persistent?: boolean
}

export class HtmlOverlayElement extends BaseElement<HtmlOverlay> {

	public static register(factory: PixiLayoutFactory) {
		factory.register("html", config => new this(factory, config))
	}

	private constructor(factory: PixiLayoutFactory, config: HtmlOverlayElementConfig) {
		super(factory, config, new HtmlOverlay())
		if (config.style) {
			this.handle.style = config.style
		}
		if (config.content) {
			this.handle.content = config.content
		}
		if (config.persistent) {
			this.handle.persistent = config.persistent
		}
	}

	protected onUpdate() {
		const width = this.computedWidth
		const height = this.computedHeight
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.position.set(this.pivotedLeft, this.pivotedTop)
		this.handle.pivot.set(width * this._xPivot, height * this._yPivot)
		this.handle.scale.set(this._scale)
		this.handle.width = width
		this.handle.height = height
		this.applyFlip()
	}

	protected onDetach() {
		this.handle.detach()
	}

	public set style(value: string) {
		this.handle.style = value
	}

	public get style() {
		return this.handle.style
	}

	public set content(value: string) {
		this.handle.content = value
	}

	public get content() {
		return this.handle.content
	}

	public set persistent(value: boolean) {
		this.handle.persistent = value
	}

	public get persistent() {
		return this.handle.persistent
	}

	public detach() {
		this.handle.detach()
	}

	public attach(renderer: Renderer) {
		this.handle.attach(renderer)
	}

	public get htmlRoot() {
		return this.handle.htmlRoot
	}
}

export default HtmlOverlayElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"html": HtmlOverlayElementConfig
	}
}
