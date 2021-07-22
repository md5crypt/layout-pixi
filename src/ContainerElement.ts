import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

export interface ContainerElementConfig extends BaseConfig {
	scale?: number
}

export class ContainerElement extends BaseElement {
	declare public readonly handle: Container
	private _scale: number

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container", (factory, name, config) => new this({
			factory,
			name,
			config,
			type: "container",
			handle: new Container()
		}))
	}

	protected constructor(props: BaseConstructorProperties<ContainerElementConfig>) {
		super(props)
		this._scale = 1
		const config = props.config
		if (config) {
			if (config.scale) {
				this.scale = config.scale
			}
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
		this.onScaleChange(this._parentScale)
		this.setDirty()
	}

	public get scale() {
		return this._scale
	}
}

export default ContainerElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		container: {config: ContainerElementConfig, element: ContainerElement}
	}
}
