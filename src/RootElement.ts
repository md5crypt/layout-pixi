import { BaseElement, BaseConfig } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement<RootElement> {
	declare public readonly handle: Container

	public constructor(factory: LayoutFactory, config?: BaseConfig) {
		super({
			type: "root",
			factory,
			config: {
				name: "@root",
				volatile: true,
				...config
			}
		}, new Container())
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
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
		element.onScaleChange(this._parentScale * this._scale)
	}
}

export default RootElement
