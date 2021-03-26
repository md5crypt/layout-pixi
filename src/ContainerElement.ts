import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

export class ContainerElement extends BaseElement {
	public readonly handle!: Container

	constructor(name?: string, config?: BaseConfig, handle?: Container) {
		super(handle || new Container(), name, config)
	}

	public set interactive(value: boolean) {
		super.interactive = value
		this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(this.left + this.width / 2, this.top + this.height / 2)
		this.handle.pivot.set(this.width / 2, this.height / 2)
	}
}

layoutFactory.register("container", (name, config) => new ContainerElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		container: {config: BaseConfig, element: ContainerElement}
	}
}
