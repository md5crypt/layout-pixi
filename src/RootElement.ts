import { BaseElement, BaseElementConfig } from "./BaseElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"
import { Container } from "@pixi/display"

export interface RootElementConfig extends BaseElementConfig<"root", RootElement> {
}

export class RootElement extends BaseElement<Container> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("root", config => new this(factory, config))
	}

	public constructor(factory: PixiLayoutFactory, config: RootElementConfig) {
		super(factory, config, new Container())
	}

	protected onUpdate() {
		this.handle.scale.set(this._scale)
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.children[index].handle)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if (index >= this.children.length) {
			this.handle.addChild(element.handle)
		} else {
			const position = this.handle.getChildIndex(this.children[index].handle)
			this.handle.addChildAt(element.handle, position)
		}
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"root": RootElementConfig
	}
}
