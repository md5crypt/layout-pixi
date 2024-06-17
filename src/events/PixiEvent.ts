import { Point } from "@pixi/math"
import { DisplayObject } from "@pixi/display"
import { Renderer } from "@pixi/core"

export type PixiEventType = "pointerdown" | "pointermove" | "pointerout" | "pointerover" | "pointertap" | "pointerup" | "pointerupoutside"

export class PixiEvent {
	public readonly global: Point
	public readonly originalEvent: PointerEvent
	public readonly pointerId: number
	public readonly isPrimary: boolean
	public readonly button: number
	public readonly buttons: number
	public readonly width: number
	public readonly height: number
	public readonly tiltX: number
	public readonly tiltY: number
	public readonly pointerType: "mouse" | "touch"
	public readonly pressure: number
	public readonly twist: number
	public readonly tangentialPressure: number

	// @internal
	public __type: "pointerdown" | "pointerup" | "pointermove" | "pointercancel" | "pointerupdate"

	private _target: DisplayObject | null

	// @internal
	constructor(event: PointerEvent, renderer: Renderer) {
		this.__type = event.type as typeof this.__type
		this.originalEvent = event
		this.pointerId = event.pointerId
		this.isPrimary = event.isPrimary
		this.button = event.button
		this.buttons = event.buttons
		this.width = event.width
		this.height = event.height
		this.tiltX = event.tiltX
		this.tiltY = event.tiltY
		this.pointerType = event.pointerType == "mouse" ? "mouse" : "touch",
		this.pressure = event.pressure
		this.twist = event.twist
		this.tangentialPressure = event.tangentialPressure
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
