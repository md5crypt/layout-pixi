import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { HtmlOverlay } from "./htmlOverlay/index.js"
import { Rectangle } from "@pixi/math"

export interface HtmlOverlayElementConfig extends BaseConfig<HtmlOverlayElement> {
	style?: string
	content?: string
}

export class HtmlOverlayElement extends BaseElement<HtmlOverlayElement> {
	declare public readonly handle: HtmlOverlay

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("htmlOverlay", props => new this(props, new HtmlOverlay()))
	}

	protected constructor(props: BaseConstructorProperties<HtmlOverlayElementConfig>, handle: HtmlOverlay) {
		super(props, handle)
		const config = props.config
		if (config) {
			if (config.style) {
				this.handle.style = config.style
			}
			if (config.content) {
				this.handle.content = config.content
			}
		}
	}

	protected onUpdate() {
		super.onUpdate()
		const width = this.innerWidth
		const height = this.innerHeight
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.position.set(this.computedLeft, this.computedTop)
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

	public get htmlRoot() {
		return this.handle.htmlRoot
	}
}

export default HtmlOverlayElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"htmlOverlay": {config: HtmlOverlayElementConfig, element: HtmlOverlayElement}
	}
}
