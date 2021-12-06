import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

export class ContainerElement extends BaseElement {
	declare public readonly handle: Container

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container", props => new this(props, new Container()))
	}

	protected constructor(props: BaseConstructorProperties<BaseConfig<any>>, handle: Container) {
		super(props, handle)
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
			this.innerLeft + this._scale * (this.width / 2),
			this.innerTop + this._scale * (this.height / 2)
		)
		this.handle.pivot.set(this.width * this.pivot[0], this.height * this.pivot[1])
		this.handle.scale.set(this._scale)
		this.applyFlip()
	}
}

export default ContainerElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		container: {config: BaseConfig, element: ContainerElement}
	}
}
