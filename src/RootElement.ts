import { BaseElement, BaseConfig } from "./BaseElement"
import { Container } from "@pixi/display"

export class RootElement extends BaseElement {
	public readonly handle!: Container

	public constructor(config?: BaseConfig) {
		super(new Container(), "@root", config)
		this.updateConfig({ volatile: true })
	}

	protected onUpdate() {
		this.handle.visible = this.enabled
	}

	public set scale(value: number) {
		this.handle.scale.set(value)
	}
}
