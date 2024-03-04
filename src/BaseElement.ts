import { LayoutElement, LayoutElementConfig } from "@md5crypt/layout"
import { DisplayObject } from "@pixi/display"
import type { PixiEvent, PixiEventType } from "./events"
import { PixiLayoutFactory, PixiElementConfig } from "./PixiLayoutFactory"
import { Matrix } from "@pixi/math"

export const enum BlendMode {
	NORMAL = 0,
	ADD = 1,
	MULTIPLY = 2,
	SCREEN = 3
}

export interface BaseElementConfig<TYPE extends string = string, SELF extends BaseElement = any> extends LayoutElementConfig<PixiElementConfig, SELF> {
	type: TYPE

	/**
	 * z index works only for controlling render order inside direct parent
	 *
	 * utilizes the PIXI sorted flag on container
	 * @defaultValue 0
	 */
	zIndex?: number

	/**
	 * 0 being transparent and 1 fully opaque
	 * @defaultValue 1
	 */
	alpha?: number

	/**
	 * in degrees, rotates around the {@link pivot} point
	 * @defaultValue 0
	 */
	rotation?: number

	/**
	 * mirrors object by internally setting negative scale
	 * @defaultValue false
	 */
	flipped?: false | "vertical" | "horizontal"

	/**
	 * when set object becomes an interaction target and will receive interaction events
	 * @defaultValue false
	 */
	interactive?: boolean

	/**
	 * when set disables interaction event interaction processing for the entire subtree. The element itself
	 * can still be interactive.
	 * @defaultValue false
	 */
	noPropagation?: boolean

	/**
	 * element pivot point (center point for this element's rotation) with values relative to the elements's size
	 * * array with [x, y] values or single number that get expanded to [x, x]
	 * * [0, 0] is top left corner
	 * * [0.5, 0.5] is center
	 * * [1, 1] is bottom right
	 * * any other values are also valid
	 * @defaultValue [0, 0]
	 */
	pivot?: [number, number] | number

	/**
	 * elements with button mode set will affect mouse cursor when hovered
	 */
	buttonMode?: boolean
}

export abstract class BaseElement<HANDLE extends DisplayObject = DisplayObject> extends LayoutElement<PixiElementConfig, BaseElement> {
	declare public readonly config: Readonly<BaseElementConfig>
	declare public readonly factory: PixiLayoutFactory
	
	/** the underlying PIXI object */
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

	/** apply the flip value by setting scale sign */
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

	/**
	 * register an event handler on a element in this element tree
	 * @param event - event name
	 * @param element - the element path on which the event should be registered on
	 * @param callback - the event handler
	 * 
	 * @returns callback as passed to function
	 */
	public on(event: PixiEventType, element: string, callback: (event: PixiEvent) => void): (event: PixiEvent) => void

	/**
	 * register an event handler on multiple element in this element tree
	 * @param event - event name
	 * @param elements - array of element paths on which the event should be registered on
	 * @param callback - the event handler
	 * 
	 * @returns callback as passed to function
	 */
	public on(event: PixiEventType, element: string[], callback: (event: PixiEvent) => void): (event: PixiEvent) => void

	/**
	 * register an event handler on this element
	 * @param event - event name
	 * @param callback - the event handler
	 * 
	 * @returns callback as passed to function
	 */
	public on(event: PixiEventType, callback: (event: PixiEvent) => void): (event: PixiEvent) => void

	public on(event: PixiEventType, arg1: string | string[] | ((event: PixiEvent) => void), arg2?: (event: PixiEvent) => void): (event: PixiEvent) => void {
		if (arg2 === undefined) {
			this.handle.on(event, arg1 as (event: PixiEvent) => void)
			return arg1 as (event: PixiEvent) => void
		} else if (typeof arg1 == "string") {
			this.getElement(arg1).on(event, arg2)
			return arg2
		} else {
			for (let i = 0; i < arg1.length; i += 1) {
				this.getElement((arg1 as string[])[i]).on(event, arg2)
			}
			return arg2
		}
	}

	/**
	 * calculate the transform matrix for this element
	 *
	 * it will not necessary be the same as the underlying PIXI's objects localTransform
	 * 
	 * the matrix is not cached and created on demand
	 * 
	 * @param matrix - by default a new matrix is created each call, if an matrix is passed it will be used instead
	 * of creating a new object
	 * 
	 * @returns the resulting matrix
	 */
	public getLocalMatrix(matrix?: Matrix) {
		if (!matrix) {
			matrix = new Matrix()
		} else {
			matrix.identity()
		}
		
		matrix.translate(
			-this.computedWidth * this.xPivot,
			-this.computedHeight * this._yPivot
		)
		matrix.rotate(this.handle.rotation)
		matrix.scale(this._scale, this._scale)
		matrix.translate(this.pivotedLeft, this.pivotedTop)
		return matrix
	}

	/** final left value that should be used by display objects */
	protected get pivotedLeft() {
		return this.computedLeft + this._scale * this._xPivot * this.computedWidth
	}

	/** final top value that should be used by display objects */
	protected get pivotedTop() {
		return this.computedTop + this._scale * this._yPivot * this.computedHeight
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

	/** {@inheritDoc BaseElementConfig.zIndex} */
	public get zIndex() {
		return this.handle.zIndex
	}

	public set zIndex(value: number) {
		this.handle.zIndex = value
	}

	/** {@inheritDoc BaseElementConfig.alpha} */
	public get alpha() {
		return this.handle.alpha
	}

	public set alpha(value: number) {
		this.handle.alpha = value
	}

	/** {@inheritDoc BaseElementConfig.rotation} */
	public get rotation() {
		return this.handle.angle
	}

	public set rotation(value: number) {
		this.handle.angle = value
	}

	/** {@inheritDoc BaseElementConfig.flipped} */
	public get flipped() {
		return this._flipped || false
	}

	public set flipped(value: false | "vertical" | "horizontal") {
		if (this._flipped != value) {
			this._flipped = value
			this._dirty = true
		}
	}

	/** {@inheritDoc BaseElementConfig.interactive} */
	public get interactive() {
		return this.handle.interactive || false
	}

	public set interactive(value: boolean) {
		this.handle.interactive = value
	}

	/** {@inheritDoc BaseElementConfig.noPropagation} */
	public get noPropagation() {
		return !this.handle.interactiveChildren
	}

	public set noPropagation(value: boolean) {
		this.handle.interactiveChildren = !value
	}

	/** x component of rotation pivot point */
	public get xPivot() {
		return this._xPivot
	}

	public set xPivot(value: number) {
		if (this._xPivot != value) {
			this._xPivot = value
			this._dirty = true
		}
	}

	/** y component of rotation pivot point */
	public get yPivot() {
		return this._yPivot
	}

	public set yPivot(value: number) {
		if (this._yPivot != value) {
			this._yPivot = value
			this._dirty = true
		}
	}

	/** {@inheritDoc BaseElementConfig.buttonMode} */
	public get buttonMode() {
		return this.handle.buttonMode
	}

	public set buttonMode(value: boolean) {
		this.handle.buttonMode = value
	}
}
