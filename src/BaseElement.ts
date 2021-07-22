import { LayoutElement } from "@md5crypt/layout"
import { Container } from "@pixi/display"
import { Graphics } from "@pixi/graphics"
import type {} from "@pixi/interaction"

import { LayoutFactory, LayoutElementJson } from "./LayoutFactory.js"

export interface BaseConfig {
	mask?: boolean
	sorted?: boolean
	zIndex?: number
	alpha?: number
	rotation?: number
	flipped?: false | "vertical" | "horizontal"
	interactive?: boolean
	anchor?: [number, number] | number
}

export interface BaseConstructorProperties<T extends BaseConfig = BaseConfig> {
	factory: LayoutFactory
	handle: Container
	type: string
	config?: T
	name?: string
}

export abstract class BaseElement extends LayoutElement<BaseElement, LayoutElementJson> {
	declare readonly factory: LayoutFactory

	public readonly handle: Container
	private hidden: boolean
	private _mask?: boolean
	protected _anchor: [number, number]
	protected _parentScale: number

	protected constructor(props: BaseConstructorProperties) {
		super(props.factory, props.type, props.name)
		this.handle = props.handle
		this.hidden = false
		this._anchor = [0, 0]
		this._parentScale = 1
		const config = props.config
		if (config) {
			this._mask = config.mask
			if (config.zIndex) {
				this.handle.zIndex = config.zIndex
			}
			if (config.sorted) {
				this.handle.sortableChildren = true
			}
			if (config.interactive) {
				this.interactive = true
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
			if (config.anchor) {
				if (Array.isArray(config.anchor)) {
					this._anchor[0] = config.anchor[0]
					this._anchor[1] = config.anchor[1]
				} else {
					this._anchor[0] = config.anchor
					this._anchor[1] = config.anchor
				}
			}
		}
	}

	public get innerTop() {
		return this._anchor[1] ? super.innerTop - this._anchor[1] * this.scale * this.height : super.innerTop
	}

	public get innerLeft() {
		return this._anchor[0] ? super.innerLeft - this._anchor[0] * this.scale * this.width : super.innerLeft
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
		return this.handle.visible ? this.handle.alpha : 0
	}

	public set alpha(value: number) {
		this.hidden = value === 0
		this.handle.visible = value !== 0
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

	public get interactiveChildren() {
		return this.handle.interactiveChildren || false
	}

	public set interactiveChildren(value: boolean) {
		this.handle.interactiveChildren = value
	}

	public get contentHeight() {
		return this.handle.width
	}

	public get contentWidth() {
		return this.handle.height
	}

	public get scale() {
		return 1
	}

	public get globalScale() {
		return this.scale * this._parentScale
	}

	public get globalBoundingBox() {
		const result = {
			top: this.innerTop,
			left: this.innerLeft,
			width: this.width * this.scale,
			height: this.height * this.scale
		}
		let parent = this._parent
		while (parent) {
			if (parent.scale) {
				result.top = (result.top * parent.scale) + parent.innerTop
				result.left = (result.left * parent.scale) + parent.innerLeft
				result.width *= parent.scale
				result.height *= parent.scale
			} else {
				result.top += parent.innerTop
				result.left += parent.innerLeft
			}
			parent = parent._parent
		}
		return result
	}

	public get mask() {
		return this.handle.mask != null
	}

	public set mask(value: boolean) {
		if (this.mask != value) {
			if (this.mask) {
				if (this.handle.mask) {
					this.handle.removeChild(this.handle.mask as Container)
					this.handle.mask = null
				}
			} else {
				this.setDirty()
			}
			this.mask = value
		}
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

	public on(event: string, callback: Function) {
		this.handle.on(event, callback as any)
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.children[index].handle)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if ((index >= (this.children.length - 1)) || this.handle.sortableChildren) {
			this.handle.addChild(element.handle)
		} else {
			const position = this.handle.getChildIndex(this.children[index].handle)
			this.handle.addChildAt(element.handle, position)
		}
		element.onScaleChange(this._parentScale)
	}

	protected onScaleChange(scale: number) {
		this._parentScale = scale
		for (let i = 0; i < this.children.length; i += 1) {
			this.children[i].onScaleChange(this._parentScale * this.scale)
		}
	}

	protected get computedLeft() {
		return this.config.padding.left + this.innerLeft + this.innerWidth / 2
	}

	protected get computedTop() {
		return this.config.padding.top + this.innerTop + this.innerHeight / 2
	}

	protected onUpdate() {
		this.handle.visible = this.enabled && !this.hidden
		if (this._mask) {
			const graphics = new Graphics()
			graphics.beginFill(0xFFFFFF)
			graphics.drawRect(
				this.config.padding.left,
				this.config.padding.top,
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

export default BaseElement
