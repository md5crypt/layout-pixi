import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

export interface ContainerElementConfig extends BaseConfig {
	scale?: number
}

export class ContainerElement extends BaseElement {
	public readonly handle!: Container
	private _scale: number

	constructor(name?: string, config?: ContainerElementConfig, handle?: Container) {
		super(handle || new Container(), "container", name, config)
		this._scale = 1
		if (config?.scale) {
			this.scale = config.scale
		}
	}

	public set interactive(value: boolean) {
		if (super.interactive != value) {
			super.interactive = value
			if (value) {
				if (this.widthReady && this.heightReady) {
					this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
				} else {
					this.setDirty()
				}
			}
		}
	}

	public get interactive() {
		return super.interactive
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, this.width, this.height)
		}
		this.handle.position.set(
			this.innerLeft + this.scale * (this.width / 2),
			this.innerTop + this.scale * (this.height / 2)
		)
		this.handle.pivot.set(this.width / 2, this.height / 2)
	}

	public set scale(value: number) {
		this._scale = value
		this.handle.scale.set(value)
		this.setDirty()
	}

	public get scale() {
		return this._scale
	}
}

layoutFactory.register("container", (name, config) => new ContainerElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		container: {config: ContainerElementConfig, element: ContainerElement}
	}
}
