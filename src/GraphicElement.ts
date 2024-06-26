import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { Graphics } from "@pixi/graphics"
import { Rectangle } from "@pixi/math"

export interface GraphicElementConfig extends BaseElementConfig<"graphic", GraphicElement> {
	onDraw?: (self: GraphicElement) => void
	blendMode?: BlendMode
	autoClear?: boolean
	tint?: number
}

export class GraphicElement extends BaseElement<Graphics> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("graphic", config => new this(factory, config))
	}

	private _onDraw?: (self: GraphicElement) => void
	public autoClear: boolean

	private constructor(factory: PixiLayoutFactory, config: GraphicElementConfig) {
		super(factory, config, new Graphics())
		this.autoClear = true
		this._onDraw = config.onDraw
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
		if (config.autoClear !== undefined) {
			this.autoClear = config.autoClear
		}
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
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

	public get tint() {
		return this.handle.tint
	}

	public set tint(value: number) {
		this.handle.tint = value
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
		this.applyFlip()
		if (this.autoClear) {
			this.handle.clear()
		}
		if (this._onDraw) {
			this._onDraw(this)
		}
	}
}

export default GraphicElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		graphic: GraphicElementConfig
	}
}
