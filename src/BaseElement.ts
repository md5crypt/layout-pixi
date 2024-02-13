import { LayoutElement, LayoutElementConfig } from "@md5crypt/layout"
import { DisplayObject } from "@pixi/display"
import type { PixiEvent, PixiEventType } from "./events"
import { PixiLayoutFactory, PixiElementConfig } from "./PixiLayoutFactory"

export const enum BlendMode {
	NORMAL = 0,
	ADD = 1,
	MULTIPLY = 2,
	SCREEN = 3
}

export interface BaseElementConfig<TYPE extends string = string, SELF extends BaseElement = any> extends LayoutElementConfig<PixiElementConfig, SELF> {
	type: TYPE
	scale?: number
	zIndex?: number
	alpha?: number
	rotation?: number
	flipped?: false | "vertical" | "horizontal"
	interactive?: boolean
	noPropagation?: boolean
	pivot?: [number, number] | number
	buttonMode?: boolean
}

export abstract class BaseElement<HANDLE extends DisplayObject = DisplayObject> extends LayoutElement<PixiElementConfig, BaseElement> {
	declare public readonly config: Readonly<BaseElementConfig>
	declare public readonly factory: PixiLayoutFactory
	
	public readonly handle: HANDLE
	protected _xPivot: number
	protected _yPivot: number
	protected _flipped: "vertical" | "horizontal" | false

	protected constructor(factory: PixiLayoutFactory, config: Readonly<BaseElementConfig>, handle: HANDLE) {
		super(factory, config)
		this.handle = handle
		this._flipped = false
		this._xPivot = 0.5
		this._yPivot = 0.5
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

	protected get pivotLeft() {
		return this.computedLeft + this._scale * this._xPivot * this.computedWidth
	}

	protected get pivotTop() {
		return this.computedTop + this._scale * this._yPivot * this.computedHeight
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

	public setPivot(x: number, y?: number) {
		this.xPivot = x
		this.yPivot = y !== undefined ? y : x
	}

	public get enabled() {
		return this._enabled
	}

	public set enabled(value: boolean) {
		if (this._enabled != value) {
			this.handle.visible = value
			this._enabled = value
			this._dirty = true
		}
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
			this._dirty = true
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

	public get xPivot() {
		return this._xPivot
	}

	public set xPivot(value: number) {
		if (this._xPivot != value) {
			this._xPivot = value
			this._dirty = true
		}
	}

	public get yPivot() {
		return this._yPivot
	}

	public set yPivot(value: number) {
		if (this._yPivot != value) {
			this._yPivot = value
			this._dirty = true
		}
	}

	public get buttonMode() {
		return this.handle.buttonMode
	}

	public set buttonMode(value: boolean) {
		this.handle.buttonMode = value
	}
}

export default BaseElement
