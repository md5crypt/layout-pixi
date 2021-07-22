import { BaseElement, BaseConfig } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement {
	declare public readonly handle: Container
	private _scale: number

	public constructor(factory: LayoutFactory, config?: BaseConfig) {
		super({
			factory,
			type: "root",
			name: "@root",
			config,
			handle: new Container()
		})
		this.updateConfig({ volatile: true })
		this._scale = 1
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
	}

	public set scale(value: number) {
		this._scale = value
		this.handle.scale.set(value)
		this.onScaleChange(1)
	}

	public get scale() {
		return this._scale
	}
}

export default RootElement
