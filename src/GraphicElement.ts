import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Graphics } from "@pixi/graphics"
import { Rectangle } from "@pixi/math"

export interface GraphicElementConfig extends BaseConfig {
	draw?: (self: GraphicElement) => void
}

export class GraphicElement extends BaseElement {
	public readonly handle!: Graphics
	public draw?: (self: GraphicElement) => void

	constructor(name?: string, config?: GraphicElementConfig) {
		super(new Graphics(), "graphic", name, config)
		if (config && config.draw) {
			this.draw = config.draw
		}
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(this.computedLeft, this.computedTop)
		this.handle.pivot.set(this.width / 2, this.height / 2)
		this.handle.clear()
		if (this.draw) {
			this.draw(this)
		}
	}
}

layoutFactory.register("graphic", (name, config) => new GraphicElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		graphic: {config: GraphicElementConfig, element: BaseElement}
	}
}
