import { LayoutElement, LayoutElementConfig, LayoutElementConstructorProperties } from "@md5crypt/layout"
import { DisplayObject } from "@pixi/display"
import type { PixiEvent, PixiEventType } from "./events"

import { LayoutFactory, LayoutElementJson } from "./LayoutFactory.js"

export const enum BlendMode {
	NORMAL = 0,
	ADD = 1,
	MULTIPLY = 2,
	SCREEN = 3
}

export interface BaseConfig<T extends BaseElement<T> = BaseElement> extends LayoutElementConfig<T> {
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

export interface BaseConstructorProperties<T extends LayoutElementConfig> extends LayoutElementConstructorProperties<T> {
	factory: LayoutFactory
}

export abstract class BaseElement<T extends BaseElement = any> extends LayoutElement<LayoutElementJson, BaseElement, T> {
	declare public readonly factory: LayoutFactory

	public readonly handle: DisplayObject
	private _hidden: boolean
	protected _xAnchor: number
	protected _yAnchor: number
	protected _xPivot: number
	protected _yPivot: number
	protected _flipped: "vertical" | "horizontal" | false

	protected constructor(props: BaseConstructorProperties<BaseConfig<T>>, handle: DisplayObject) {
		super(props)
		this.handle = handle
		this._hidden = false
		this._flipped = false
		this._xAnchor = 0
		this._yAnchor = 0
		this._xPivot = 0.5
		this._yPivot = 0.5

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
					this._xAnchor = config.anchor[0]
					this._yAnchor = config.anchor[1]
				} else {
					this._xAnchor = config.anchor
					this._yAnchor = config.anchor
				}
			}
			if (config.pivot) {
				if (Array.isArray(config.pivot)) {
					this._xPivot = config.pivot[0]
					this._yPivot = config.pivot[1]
				} else {
					this._xPivot = config.pivot
					this._yPivot = config.pivot
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
		let top = super.innerTop
		if (this._yAnchor) {
			top -= this._yAnchor * this._scale * this.height
		}
		return top
	}

	public get innerLeft() {
		let left = super.innerLeft
		if (this._xAnchor) {
			left -= this._xAnchor * this._scale * this.width
		}
		return left
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

	public get anchor() {
		return [this._xAnchor, this.yAnchor] as Readonly<[number, number]>
	}

	public set anchor(value: Readonly<[number, number]>) {
		if (this._xAnchor != value[0] || this._yAnchor != value[1]) {
			this._xAnchor = value[0]
			this._yAnchor = value[1]
			this.setDirty()
		}
	}

	public get xAnchor() {
		return this._xAnchor
	}

	public set xAnchor(value: number) {
		if (this._xAnchor != value) {
			this._xAnchor = value
			this.setDirty()
		}
	}

	public get yAnchor() {
		return this._yAnchor
	}

	public set yAnchor(value: number) {
		if (this._yAnchor != value) {
			this._yAnchor = value
			this.setDirty()
		}
	}

	public setAnchor(x: number, y?: number) {
		const yValue = y === undefined ? x : y
		if (this._xAnchor != x || this._yAnchor != yValue) {
			this._xAnchor = x
			this._yAnchor = yValue
			this.setDirty()
		}
	}

	public get pivot() {
		return [this._xPivot, this.yPivot] as Readonly<[number, number]>
	}

	public set pivot(value: Readonly<[number, number]>) {
		if (this._xPivot != value[0] || this._yPivot != value[1]) {
			this._xPivot = value[0]
			this._yPivot = value[1]
			this.setDirty()
		}
	}

	public get xPivot() {
		return this._xPivot
	}

	public set xPivot(value: number) {
		if (this._xPivot != value) {
			this._xPivot = value
			this.setDirty()
		}
	}

	public get yPivot() {
		return this._yPivot
	}

	public set yPivot(value: number) {
		if (this._yPivot != value) {
			this._yPivot = value
			this.setDirty()
		}
	}

	public setPivot(x: number, y?: number) {
		const yValue = y === undefined ? x : y
		if (this._xPivot != x || this._yPivot != yValue) {
			this._xPivot = x
			this._yPivot = yValue
			this.setDirty()
		}
	}

	public get buttonMode() {
		return this.handle.buttonMode
	}

	public set buttonMode(value: boolean) {
		this.handle.buttonMode = value
	}

	public on(event: PixiEventType, element: string, callback: (event: PixiEvent) => void): void
	public on(event: PixiEventType, element: string[], callback: (event: PixiEvent) => void): void
	public on(event: PixiEventType, callback: (event: PixiEvent) => void): void
	public on(event: PixiEventType, arg1: string | string[] | ((event: PixiEvent) => void), arg2?: (event: PixiEvent) => void) {
		if (arg2 === undefined) {
			this.handle.on(event, arg1 as any)
		} else {
			const elements = Array.isArray(arg1) ? arg1 : [arg1] as string[]
			for (const element of elements ) {
				this.getElement(element).on(event, arg2 as any)
			}
		}
	}

	protected get computedLeft() {
		return this.innerLeft + this._scale * this._xPivot * this.innerWidth
	}

	protected get computedTop() {
		return this.innerTop + this._scale * this._yPivot * this.innerHeight
	}

	protected onDisable() {
		this.handle.visible = false
	}

	protected onUpdate() {
		this.handle.visible = this._enabled && !this._hidden
	}
}

export default BaseElement
