import { LayoutElement, LayoutElementConfig, LayoutElementConstructorProperties } from "@md5crypt/layout"
import { DisplayObject } from "@pixi/display"
import type { InteractionEvent } from "@pixi/interaction"

import { LayoutFactory, LayoutElementJson } from "./LayoutFactory.js"

export const enum BlendMode {
	NORMAL = 0,
	ADD = 1,
	MULTIPLY = 2,
	SCREEN = 3
}

export type EventTypeName = (
	"click" | "mousedown" | "mousemove" | "mouseout" | "mouseover" | "mouseup" |
	"mouseupoutside" | "pointercancel" | "pointerdown" | "pointermove" | "pointerout" |
	"pointerover" | "pointertap" | "pointerup" | "pointerupoutside" | "rightclick" |
	"rightdown" | "rightup" | "rightupoutside" | "tap" | "touchcancel" | "touchend" |
	"touchendoutside" | "touchmove" | "touchstart"
)

export interface BaseConfig<T extends BaseElement = BaseElement> extends LayoutElementConfig<T> {
	scale?: number
	zIndex?: number
	alpha?: number
	rotation?: number
	flipped?: false | "vertical" | "horizontal"
	interactive?: boolean
	noPropagation?: boolean
	anchor?: [number, number] | number
	pivot?: [number, number] | number
	buttonMode?: boolean
}

export interface BaseConstructorProperties<T> extends LayoutElementConstructorProperties<T> {
	factory: LayoutFactory
}

export abstract class BaseElement extends LayoutElement<BaseElement, LayoutElementJson> {
	declare public readonly children: BaseElement[]
	declare public readonly factory: LayoutFactory

	public readonly handle: DisplayObject
	private _hidden: boolean
	protected _scale: number
	protected _anchor: [number, number]
	protected _pivot: [number, number]
	protected _parentScale: number
	protected _flipped: "vertical" | "horizontal" | false

	protected constructor(props: BaseConstructorProperties<BaseConfig<any>>, handle: DisplayObject) {
		super(props)
		this.handle = handle
		this._hidden = false
		this._flipped = false
		this._anchor = [0, 0]
		this._pivot = [0.5, 0.5]
		this._parentScale = 1
		this._scale = 1

		const config = props.config
		if (config) {
			if (config.enabled === false) {
				this.handle.visible = false
			}
			if (config.zIndex) {
				this.handle.zIndex = config.zIndex
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
			if (config.buttonMode !== undefined) {
				this.handle.buttonMode = config.buttonMode
			}
		}
	}

	protected applyFlip() {
		const value = this._flipped
		if (value == "vertical") {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = -Math.abs(this.handle.scale.y)
		} else if (value == "horizontal") {
			this.handle.scale.x = -Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		} else {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		}
	}

	public get innerTop() {
		return this._anchor[1] ? super.innerTop - this._anchor[1] * this._scale * this.height : super.innerTop
	}

	public get innerLeft() {
		return this._anchor[0] ? super.innerLeft - this._anchor[0] * this._scale * this.width : super.innerLeft
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
		this._hidden = value === 0
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
		return this._flipped || false
	}

	public set flipped(value: false | "vertical" | "horizontal") {
		if (this._flipped != value) {
			this._flipped = value
			this.setDirty()
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
		if (this._scale != value) {
			this._scale = value
			this.onScaleChange(this._parentScale)
			this.setDirty()
		}
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
			width: 0,
			height: 0
		}
		if (this._width == null && this.flexMode == "none") {
			const bounds = this.horizontalBounds
			result.left -= result.left - bounds[0]
			result.width = bounds[1] - bounds[0]
		} else {
			result.width = this.innerWidth * this._scale
		}
		if (this._height == null && this.flexMode == "none") {
			const bounds = this.verticalBounds
			result.top -= result.top - bounds[0]
			result.height = bounds[1] - bounds[0]
		} else {
			result.height = this.innerHeight * this._scale
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
		const width = this.width * this.scale
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
		min *= this.scale
		max *= this.scale
		return isFinite(min + max) ? [offset + min, offset + max] : [offset, offset]
	}

	public get verticalBounds() {
		if (!this.heightReady) {
			return [0, 0]
		}
		const height = this.height * this.scale
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
		min *= this.scale
		max *= this.scale
		return isFinite(min + max) ? [offset + min, offset + max] : [offset, offset]
	}

	public get anchor() {
		return this._anchor as Readonly<[number, number]>
	}

	public set anchor(value: Readonly<[number, number]>) {
		if (this._anchor[0] != value[0] || this._anchor[1] != value[1]) {
			this._anchor[0] = value[0]
			this._anchor[1] = value[1]
			this.setDirty()
		}
	}

	public get xAnchor() {
		return this._anchor[0]
	}

	public set xAnchor(value: number) {
		if (this._anchor[0] != value) {
			this._anchor[0] = value
			this.setDirty()
		}
	}

	public get yAnchor() {
		return this._anchor[1]
	}

	public set yAnchor(value: number) {
		if (this._anchor[1] != value) {
			this._anchor[1] = value
			this.setDirty()
		}
	}

	public setAnchor(x: number, y?: number) {
		const yValue = y === undefined ? x : y
		if (this._anchor[0] != x || this._anchor[1] != yValue) {
			this._anchor[0] = x
			this._anchor[1] = yValue
			this.setDirty()
		}
	}

	public get pivot() {
		return this._pivot as Readonly<[number, number]>
	}

	public set pivot(value: Readonly<[number, number]>) {
		if (this._pivot[0] != value[0] || this._pivot[1] != value[1]) {
			this._pivot[0] = value[0]
			this._pivot[1] = value[1]
			this.setDirty()
		}
	}

	public get xPivot() {
		return this._pivot[0]
	}

	public set xPivot(value: number) {
		if (this._pivot[0] != value) {
			this._pivot[0] = value
			this.setDirty()
		}
	}

	public get yPivot() {
		return this._pivot[1]
	}

	public set yPivot(value: number) {
		if (this._pivot[1] != value) {
			this._pivot[1] = value
			this.setDirty()
		}
	}

	public setPivot(x: number, y?: number) {
		const yValue = y === undefined ? x : y
		if (this._pivot[0] != x || this._pivot[1] != yValue) {
			this._pivot[0] = x
			this._pivot[1] = yValue
			this.setDirty()
		}
	}

	public get buttonMode() {
		return this.handle.buttonMode
	}

	public set buttonMode(value: boolean) {
		this.handle.buttonMode = value
	}

	public on(event: EventTypeName, element: string, callback: (event: InteractionEvent) => void): void
	public on(event: EventTypeName, element: string[], callback: (event: InteractionEvent) => void): void
	public on(event: EventTypeName, callback: (event: InteractionEvent) => void): void
	public on(event: EventTypeName, arg1: string | string[] | ((event: InteractionEvent) => void), arg2?: (event: InteractionEvent) => void) {
		if (arg2 === undefined) {
			this.handle.on(event, arg1 as any)
		} else {
			const elements = Array.isArray(arg1) ? arg1 : [arg1] as string[]
			for (const element of elements ) {
				this.getElement(element).on(event, arg2 as any)
			}
		}
	}

	public onScaleChange(parentScale: number) {
		this._parentScale = parentScale
		for (let i = 0; i < this.children.length; i += 1) {
			this.children[i].onScaleChange(parentScale * this._scale)
		}
	}

	protected get computedLeft() {
		return this.innerLeft + this._scale * this.pivot[0] * this.innerWidth
	}

	protected get computedTop() {
		return this.innerTop + this._scale * this.pivot[1] * this.innerHeight
	}

	protected onDisable() {
		this.handle.visible = false
	}

	protected onUpdate() {
		this.handle.visible = this._enabled && !this._hidden
	}
}

export default BaseElement
