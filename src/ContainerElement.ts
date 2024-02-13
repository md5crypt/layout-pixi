import { BaseElement, BaseElementConfig } from "./BaseElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"
import { Container } from "@pixi/display"
import { Rectangle } from "@pixi/math"

import { Graphics } from "@pixi/graphics"
import { Sprite } from "@pixi/sprite"

export interface ContainerElementConfig<TYPE extends string = "container", SELF extends ContainerElement = ContainerElement> extends BaseElementConfig<TYPE, SELF> {
	mask?: boolean
	sorted?: boolean
}

export class ContainerElement<HANDLE extends Container = Container> extends BaseElement<HANDLE> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("container", config => new this(factory, config, new Container()))
	}

	private _mask: boolean
	private _maskObject?: Sprite | Graphics

	protected constructor(factory: PixiLayoutFactory, config: ContainerElementConfig<any, any>, handle: HANDLE) {
		super(factory, config, handle)
		this._mask = false
		if (config.scale) {
			this._scale = config.scale
		}
		if (config.mask) {
			this._mask = true
		}
		if (config.sorted && this.handle) {
			this.handle.sortableChildren = true
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
	}

	protected onUpdate() {
		const width = this.computedWidth
		const height = this.computedHeight
		if (this._mask) {
			if (this._maskObject) {
				this.handle.mask = this._maskObject
			} else {
				const graphics = new Graphics()
				graphics.beginFill(0xFFFFFF)
				graphics.drawRect(0, 0, width, height)
				graphics.endFill()
				if (this.handle.mask) {
					this.handle.removeChild(this.handle.mask as Container)
				}
				this.handle.addChild(graphics)
				this.handle.mask = graphics
			}
		}
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.position.set(
			this.pivotLeft,
			this.pivotTop
		)
		this.handle.pivot.set(width * this._xPivot, height * this._yPivot)
		this.handle.scale.set(this._scale)
		this.applyFlip()
	}
}

export default ContainerElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		container: ContainerElementConfig
	}
}
