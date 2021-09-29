import { BaseElement, BaseConfig } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement {
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
}

export default RootElement
