import { LayoutElement, LayoutElementConfig, LayoutElementConstructorProperties } from "@md5crypt/layout"
import { Container } from "@pixi/display"
import { Graphics } from "@pixi/graphics"
import { Sprite } from "@pixi/sprite"
import type {} from "@pixi/interaction"

import { LayoutFactory, LayoutElementJson } from "./LayoutFactory.js"

export interface BaseConfig<T extends BaseElement = BaseElement> extends LayoutElementConfig<T> {
	scale?: number
	mask?: boolean
	maskObject?: string
	sorted?: boolean
	zIndex?: number
	alpha?: number
	rotation?: number
	flipped?: false | "vertical" | "horizontal"
	interactive?: boolean
	noPropagation?: boolean
	anchor?: [number, number] | number
	pivot?: [number, number] | number
}

export interface BaseConstructorProperties<T> extends LayoutElementConstructorProperties<T> {
	factory: LayoutFactory
}

export abstract class BaseElement extends LayoutElement<BaseElement, LayoutElementJson> {
	declare public readonly children: BaseElement[]
	declare public readonly factory: LayoutFactory

	public readonly handle: Container
	private hidden: boolean
	private _mask: boolean
	private _maskObject?: Sprite | Graphics
	protected _scale: number
	protected _anchor: [number, number]
	protected _pivot: [number, number]
	protected _parentScale: number

	protected constructor(props: BaseConstructorProperties<BaseConfig<any>>, handle: Container) {
		super(props)
		this.handle = handle
		this.hidden = false
		this._anchor = [0, 0]
		this._pivot = [0.5, 0.5]
		this._parentScale = 1
		this._scale = 1
		this._mask = false

		const config = props.config
		if (config) {
			if (config.mask) {
				this._mask = true
			}
			if (config.enabled === false) {
				this.handle.visible = false
			}
			if (config.zIndex) {
				this.handle.zIndex = config.zIndex
			}
			if (config.sorted) {
				this.handle.sortableChildren = true
			}
			if (config.interactive) {
				this.interactive = true
			}
			if (config.noPropagation) {
				this.noPropagation = true
			}
			if (config.alpha !== undefined) {
				this.alpha = config.alpha
			}
			if (config.rotation) {
				this.rotation = config.rotation
			}
			if (config.flipped) {
				this.flipped = config.flipped
			}
			if (config.scale) {
				this._scale = config.scale
			}
			if (config.anchor) {
				if (Array.isArray(config.anchor)) {
					this._anchor[0] = config.anchor[0]
					this._anchor[1] = config.anchor[1]
				} else {
					this._anchor[0] = config.anchor
					this._anchor[1] = config.anchor
				}
			}
			if (config.pivot) {
				if (Array.isArray(config.pivot)) {
					this._pivot[0] = config.pivot[0]
					this._pivot[1] = config.pivot[1]
				} else {
					this._pivot[0] = config.pivot
					this._pivot[1] = config.pivot
				}
			}
		}
	}

	public get innerTop() {
		return this._anchor[1] ? super.innerTop - this._anchor[1] * this._scale * this.height : super.innerTop
	}

	public get innerLeft() {
		return this._anchor[0] ? super.innerLeft - this._anchor[0] * this._scale * this.width : super.innerLeft
	}

	public get sorted() {
		return this.handle.sortableChildren
	}

	public set sorted(value: boolean) {
		this.handle.sortableChildren = value
	}

	public get zIndex() {
		return this.handle.zIndex
	}

	public set zIndex(value: number) {
		this.handle.zIndex = value
	}

	public get alpha() {
		return this.handle.alpha
	}

	public set alpha(value: number) {
		this.hidden = value === 0
		this.handle.visible = this.enabled && value !== 0
		this.handle.alpha = value
	}

	public get rotation() {
		return this.handle.angle
	}

	public set rotation(value: number) {
		this.handle.angle = value
	}

	public get flipped() {
		if (this.handle.scale.x >= 0 && this.handle.scale.y >= 0) {
			return false
		} else {
			return (this.handle.scale.x >= 0) ? "vertical" : "horizontal"
		}
	}

	public set flipped(value: false | "vertical" | "horizontal") {
		if (value == "vertical") {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = -Math.abs(this.handle.scale.x)
		} else if (value == "horizontal") {
			this.handle.scale.x = -Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		} else {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		}
	}

	public get interactive() {
		return this.handle.interactive || false
	}

	public set interactive(value: boolean) {
		this.handle.interactive = value
	}

	public get noPropagation() {
		return !this.handle.interactiveChildren
	}

	public set noPropagation(value: boolean) {
		this.handle.interactiveChildren = !value
	}

	public set scale(value: number) {
		this._scale = value
		this.onScaleChange(this._parentScale)
		this.setDirty()
	}

	public get scale() {
		return this._scale
	}

	public get globalScale() {
		return this._scale * this._parentScale
	}

	public get globalBoundingBox() {
		const result = {
			top: this.innerTop,
			left: this.innerLeft,
			width: this.width * this._scale,
			height: this.height * this._scale
		}
		let parent = this._parent
		while (parent) {
			if (parent._scale) {
				result.top = (result.top * parent._scale) + parent.innerTop
				result.left = (result.left * parent._scale) + parent.innerLeft
				result.width *= parent._scale
				result.height *= parent._scale
			} else {
				result.top += parent.innerTop
				result.left += parent.innerLeft
			}
			parent = parent._parent
		}
		return result
	}

	public get horizontalBounds() {
		if (!this.widthReady) {
			return [0, 0]
		}
		const width = this.width
		const offset = this.innerLeft
		if (width || this._width === 0) {
			return [offset, offset + width]
		}
		let min = Infinity
		let max = -Infinity
		for (const child of this.children) {
			const bounds = child.horizontalBounds
			min = Math.min(min, bounds[0])
			max = Math.max(max, bounds[1])
		}
		return isFinite(min + max) ? [offset + min, offset + max] : [offset, offset]
	}

	public get verticalBounds() {
		if (!this.heightReady) {
			return [0, 0]
		}
		const height = this.height
		const offset = this.innerTop
		if (height || this._height === 0) {
			return [offset, offset + height]
		}
		let min = Infinity
		let max = -Infinity
		for (const child of this.children) {
			const bounds = child.verticalBounds
			min = Math.min(min, bounds[0])
			max = Math.max(max, bounds[1])
		}
		return isFinite(min + max) ? [offset + min, offset + max] : [offset, offset]
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

	public get anchor() {
		return this._anchor as Readonly<[number, number]>
	}

	public set anchor(value: Readonly<[number, number]>) {
		this._anchor[0] = value[0]
		this._anchor[1] = value[1]
		this.setDirty()
	}

	public setAnchor(x: number, y?: number) {
		this._anchor[0] = x
		this._anchor[1] = y === undefined ? x : y
		this.setDirty()
	}

	public get pivot() {
		return this._pivot as Readonly<[number, number]>
	}

	public set pivot(value: Readonly<[number, number]>) {
		this._pivot[0] = value[0]
		this._pivot[1] = value[1]
		this.setDirty()
	}

	public setPivot(x: number, y?: number) {
		this._pivot[0] = x
		this._pivot[1] = y === undefined ? x : y
		this.setDirty()
	}

	public on(event: string, callback: Function) {
		this.handle.on(event, callback as any)
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

	protected onScaleChange(parentScale: number) {
		this._parentScale = parentScale
		for (let i = 0; i < this.children.length; i += 1) {
			this.children[i].onScaleChange(parentScale * this._scale)
		}
	}

	protected get computedLeft() {
		return this._padding.left + this.innerLeft + this._scale * (this.innerWidth / 2)
	}

	protected get computedTop() {
		return this._padding.top + this.innerTop + this._scale * (this.innerHeight / 2)
	}

	protected onDisable() {
		this.handle.visible = false
	}

	protected onUpdate() {
		this.handle.visible = this._enabled && !this.hidden
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
	}
}

export default BaseElement
