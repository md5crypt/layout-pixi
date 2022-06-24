import { BaseElement, BaseConfig, BaseConstructorProperties, BlendMode } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Graphics } from "@pixi/graphics"
import { Rectangle } from "@pixi/math"

export interface GraphicElementConfig<T extends BaseElement = GraphicElement> extends BaseConfig<T> {
	onDraw?: (self: GraphicElement) => void
	blendMode?: BlendMode
}

export class GraphicElement extends BaseElement {
	declare public readonly handle: Graphics

	private _onDraw?: (self: GraphicElement) => void

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("graphic", props => new this(props, new Graphics()))
	}

	protected constructor(props: BaseConstructorProperties<GraphicElementConfig<any>>, handle: Graphics) {
		super(props, handle)
		const config = props.config
		if (config) {
			this._onDraw = config.onDraw
			if (config.blendMode !== undefined) {
				this.handle.blendMode = config.blendMode as number
			}
		}
	}

	public get onDraw() {
		return this._onDraw
	}

	public set onDraw(value: ((self: GraphicElement) => void) | undefined) {
		this._onDraw = value
		this.setDirty()
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.width * this.pivot[0], this.height * this.pivot[1])
		this.handle.scale.set(this._scale)
		this.applyFlip()
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
