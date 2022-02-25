import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

import { Graphics } from "@pixi/graphics"
import { Sprite } from "@pixi/sprite"

export interface ContainerElementConfig<T extends BaseElement = ContainerElement> extends BaseConfig<T> {
	mask?: boolean
	sorted?: boolean
}


export class ContainerElement extends BaseElement {
	declare public readonly handle: Container

	private _mask: boolean
	private _maskObject?: Sprite | Graphics

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container", props => new this(props, new Container()))
	}

	protected constructor(props: BaseConstructorProperties<ContainerElementConfig<any>>, handle: Container) {
		super(props, handle)
		const config = props.config
		this._mask = false
		if (config) {
			if (config.scale) {
				this.scale = config.scale
			}
			if (config.mask) {
				this._mask = true
			}
			if (config.sorted && this.handle) {
				this.handle.sortableChildren = true
			}
		}
	}

	public set interactive(value: boolean) {
		if (super.interactive != value) {
			super.interactive = value
			this.setDirty()
		}
	}

	public get interactive() {
		return super.interactive
	}

	public get sorted() {
		return this.handle.sortableChildren
	}

	public set sorted(value: boolean) {
		this.handle.sortableChildren = value
	}

	public get mask() {
		return this.handle.mask != null
	}

	public set mask(value: boolean) {
		if (this._mask != value) {
			if (this._mask) {
				if (this.handle.mask) {
					if (!this._maskObject) {
						this.handle.removeChild(this.handle.mask as Container)
					}
					this.handle.mask = null
				}
			} else {
				this.setDirty()
			}
			this._mask = value
		}
	}

	public get maskObject() {
		return this._maskObject || null
	}

	public set maskObject(value: Sprite | Graphics | BaseElement | null) {
		if (this.handle.mask && !this._maskObject) {
			this.handle.removeChild(this.handle.mask as Container)
		}
		this._maskObject = value instanceof BaseElement ? (value.handle as any) : (value || undefined)
		this.handle.mask = null
		this.setDirty()
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.children[index].handle)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if ((index >= this.children.length) || this.handle.sortableChildren) {
			this.handle.addChild(element.handle)
		} else {
			const position = this.handle.getChildIndex(this.children[index].handle)
			this.handle.addChildAt(element.handle, position)
		}
		element.onScaleChange(this._parentScale * this._scale)
	}

	protected onUpdate() {
		super.onUpdate()
		if (this._mask) {
			if (this._maskObject) {
				this.handle.mask = this._maskObject
			} else {
				const graphics = new Graphics()
				graphics.beginFill(0xFFFFFF)
				graphics.drawRect(
					this._padding.left,
					this._padding.top,
					this.innerWidth,
					this.innerHeight
				)
				graphics.endFill()
				if (this.handle.mask) {
					this.handle.removeChild(this.handle.mask as Container)
				}
				this.handle.addChild(graphics)
				this.handle.mask = graphics
			}
		}
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
