import { Point } from "@pixi/math"
import { DisplayObject } from "@pixi/display"
import { Renderer } from "@pixi/core"

export interface PixiEventMapping {
	"pointerdown": PointerEvent
	"pointermove": PointerEvent
	"pointerout": PointerEvent
	"pointerover": PointerEvent
	"pointertap": PointerEvent
	"pointerup": PointerEvent
	"pointerupoutside": PointerEvent
	"wheel": WheelEvent
}

export type PixiEventType = keyof PixiEventMapping

export class PixiEvent<T extends MouseEvent = MouseEvent> {
	public readonly global: Point
	public readonly originalEvent: T
	public readonly pointerId: number
	public readonly isPrimary: boolean
	public readonly button: number
	public readonly buttons: number
	public readonly pointerType: "mouse" | "touch"

	// @internal
	public __type: "pointerdown" | "pointerup" | "pointermove" | "pointercancel" | "pointerupdate" | "wheel"

	private _target: DisplayObject | null

	// @internal
	constructor(event: MouseEvent, renderer: Renderer) {
		this.__type = event.type as typeof this.__type
		this.originalEvent = event as T

		if (event instanceof PointerEvent) {
			this.pointerId = event.pointerId
			this.isPrimary = event.isPrimary
			this.pointerType = event.pointerType == "mouse" ? "mouse" : "touch"
		} else {
			this.pointerId = -1
			this.pointerType = "mouse"
			this.isPrimary = false
		}

		this.button = event.button
		this.buttons = event.buttons
		this._target = null

		const view = renderer.view
		const rect = view.getBoundingClientRect()

		this.global = new Point(
			((event.clientX - rect.left) * (view.width / rect.width)) / renderer.resolution,
			((event.clientY - rect.top) * (view.height / rect.height)) / renderer.resolution
		)
	}

	public getLocalPosition(displayObject: DisplayObject, point?: Point) {
		return displayObject.worldTransform.applyInverse(this.global, point)
	}

	public get target() {
		return this._target
	}

	/* @internal */
	public set target(value: DisplayObject | null) {
		this._target = value
	}

	/** @deprecated comparability level with old interaction api */
	public get data() {
		return this
	}
}
