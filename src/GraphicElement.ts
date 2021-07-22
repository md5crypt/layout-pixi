import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Graphics } from "@pixi/graphics"
import { Rectangle } from "@pixi/math"

export interface GraphicElementConfig extends BaseConfig {
	draw?: (self: GraphicElement) => void
}

export class GraphicElement extends BaseElement {
	declare public readonly handle: Graphics

	private _onDraw?: (self: GraphicElement) => void

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("graphic", (factory, name, config) => new this({
			factory,
			name,
			config,
			type: "graphic",
			handle: new Graphics()
		}))
	}

	protected constructor(props: BaseConstructorProperties<GraphicElementConfig>) {
		super(props)
		const config = props.config
		if (config) {
			this._onDraw = config.draw
		}
	}

	public get onDraw() {
		return this._onDraw
	}

	public set onDraw(value: ((self: GraphicElement) => void) | undefined) {
		this._onDraw = value
		this.setDirty()
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.width / 2, this.height / 2)
		this.handle.clear()
		if (this._onDraw) {
			this._onDraw(this)
		}
	}
}

export default GraphicElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		graphic: {config: GraphicElementConfig, element: BaseElement}
	}
}
