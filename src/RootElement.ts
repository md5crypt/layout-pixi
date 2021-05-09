import { BaseElement, BaseConfig } from "./BaseElement"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement {
	public readonly handle!: Container
	private _scale: number

	public constructor(config?: BaseConfig) {
		super(new Container(), "root", "@root", config)
		this.updateConfig({ volatile: true })
		this._scale = 1
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
	}

	public set scale(value: number) {
		this._scale = value
		this.handle.scale.set(value)
	}

	public get scale() {
		return this._scale
	}
}
