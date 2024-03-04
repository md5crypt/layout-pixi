import { Ticker } from "@pixi/ticker"
import { Container, DisplayObject } from "@pixi/display"
import type { ExtensionMetadata, Renderer } from "@pixi/core"
import { ExtensionType } from "@pixi/core"
import { Point } from "@pixi/math"
import { EventEmitter } from "@pixi/utils"

import { PixiEvent } from "./PixiEvent"

declare global {
	namespace GlobalMixins {
		interface DisplayObject {
			interactive: boolean
			interactiveChildren: boolean
			hitArea?: {contains(x: number, y: number): boolean}
			cursor?: string
			get buttonMode(): boolean
			set buttonMode(value: boolean)
		}
	}
}

DisplayObject.mixin({
	interactive: false,
	interactiveChildren: true,
	get buttonMode() {
		return this.cursor ? true : false
	},
	set buttonMode(value: boolean) {
		if (value) {
			if (!this.cursor) {
				this.cursor = "pointer"
			}
		} else {
			this.cursor = undefined
		}
	}
})

interface TrackingData {
	tapSet: Set<DisplayObject>
	hoverSet: Set<DisplayObject>
}

export class EventSystem extends EventEmitter {
	public static extension: ExtensionMetadata = {
		name: "eventSystem",
		type: [
			ExtensionType.RendererPlugin,
			ExtensionType.CanvasRendererPlugin
		]
	}

	public static useGlobalTicker = true
	public static globalTickerPriority = 100
	private static _point = new Point(0, 0)

	private static treeWalk(displayObject: DisplayObject & {containsPoint?: (point: Point) => boolean}, point: Point, callback: (displayObject: DisplayObject) => void) {
		let hit = false
		if (displayObject.interactive) {
			if (displayObject.hitArea) {
				const tempPoint = this._point
				displayObject.worldTransform.applyInverse(point, tempPoint)
				hit = displayObject.hitArea.contains(tempPoint.x, tempPoint.y)
			} else if (displayObject.containsPoint) {
				hit = displayObject.containsPoint(point)
			}
			if (!hit) {
				return false
			}
		}
		if (displayObject instanceof Container && displayObject.interactiveChildren) {
			const children = displayObject.children
			for (let i = children.length - 1; i >= 0; i -= 1) {
				if (children[i].visible && this.treeWalk(children[i], point, callback)) {
					if (hit) {
						callback(displayObject)
					}
					return true
				}
			}
		}
		if (hit) {
			callback(displayObject)
		}
		return hit
	}

	public readonly renderer: Renderer
	public autoPreventDefault: boolean
	private _lastCursor: string
	private _cursor: string
	private _cursorControl: "auto" | "forced" | "disabled"

	private _capturedEvents: PixiEvent[]
	private _lastMoveEvent: PixiEvent | null
	private _lastEvent: PixiEvent | null
	private _trackingData: Map<number, TrackingData>

	private _onPointerMove
	private _onPointerDown
	private _onPointerCancel
	private _onPointerUp
	private _tickerUpdate?: () => void

	public constructor(renderer: Renderer) {
		super()
		this.renderer = renderer
		this.autoPreventDefault = false
		this._lastMoveEvent = null
		this._lastEvent = null
		this._capturedEvents = []
		this._trackingData = new Map()
		this._cursorControl = "auto"
		this._lastCursor = ""
		this._cursor = ""
		this._onPointerMove = (e: PointerEvent) => this.handleEvent("move", e)
		this._onPointerDown = (e: PointerEvent) => this.handleEvent("down", e)
		this._onPointerCancel = (e: PointerEvent) => this.handleEvent("cancel", e)
		this._onPointerUp = (e: PointerEvent) => this.handleEvent("up", e)

		const view = this.renderer.view
		view.style.touchAction = "none"

		const options = { capture: true, passive: false }
		document.addEventListener("pointermove", this._onPointerMove, options)
		view.addEventListener("pointerdown", this._onPointerDown, options)
		globalThis.addEventListener("pointercancel", this._onPointerCancel, options)
		globalThis.addEventListener("pointerup", this._onPointerUp, options)

		if (EventSystem.useGlobalTicker) {
			this._tickerUpdate = () => this.update()
			Ticker.system.add(this._tickerUpdate, undefined, EventSystem.globalTickerPriority)
		}
	}

	private handleEvent(type: string, event: PointerEvent) {
		if (this.autoPreventDefault) {
			event.preventDefault()
		}
		this._capturedEvents.push(new PixiEvent(type, event, this.renderer))
	}

	private getTrackingData(event: PixiEvent) {
		let data = this._trackingData.get(event.pointerId)
		if (!data) {
			data = {
				tapSet: new Set(),
				hoverSet: new Set()
			}
			this._trackingData.set(event.pointerId, data)
		}
		return data
	}

	public update() {
		const lastObjectRendered = this.renderer._lastObjectRendered as DisplayObject
		if (!lastObjectRendered) {
			return
		}
		const events = this._capturedEvents
		let lastMoveEvent = null
		if (events.length) {
			for (let i = 0; i < events.length; i += 1) {
				const event = events[i]
				this.processEvent(event, lastObjectRendered)
				if (event.__type == "move") {
					lastMoveEvent = event
				}
			}
			this._lastEvent = events[events.length - 1]
			this._capturedEvents = []
		}
		if (this._lastMoveEvent && !lastMoveEvent) {
			this.processEvent(this._lastMoveEvent, lastObjectRendered)
		} else if (lastMoveEvent) {
			lastMoveEvent.__type = "update"
			this._lastMoveEvent = lastMoveEvent.pointerType == "mouse" ? lastMoveEvent : null
		}
	}

	public processEvent(event: PixiEvent, root: DisplayObject) {
		const trackingData = this.getTrackingData(event)
		const tapSet = trackingData.tapSet
		switch (event.__type) {
			case "update":
				event.target = null
				/* falls through */
			case "move":
				if (event.pointerType == "mouse") {
					let cursor: string | null = null
					const hoverSet = new Set<DisplayObject>()
					const lastHoverSet = trackingData.hoverSet
					EventSystem.treeWalk(root, event.global, x => {
						if (!event.target) {
							event.target = x
						}
						if (!cursor && x.cursor) {
							cursor = x.cursor
						}
						if (event.__type == "move") {
							x.emit("pointermove", event)
						}
						if (!lastHoverSet.delete(x)) {
							x.emit("pointerover", event)
						}
						hoverSet.add(x)
					})
					lastHoverSet.forEach(x => x.interactive && x.emit("pointerout", event))
					trackingData.hoverSet = hoverSet
					if (!cursor) {
						cursor = this._cursor || "default"
					}
					if (this._cursorControl == "auto" && this._lastCursor != cursor) {
						this._lastCursor = cursor
						this.renderer.view.style.cursor = cursor
					}
				} else {
					EventSystem.treeWalk(root, event.global, x => x.emit("pointermove", event))
				}
				if (event.__type == "move") {
					this.emit("pointermove", event)
				}
				break
			case "down":
				if (tapSet.size) {
					tapSet.forEach(x => x.interactive && x.emit("pointerupoutside", event))
					tapSet.clear()
				}
				EventSystem.treeWalk(root, event.global, x => {
					if (!event.target) {
						event.target = x
					}
					x.emit("pointerdown", event)
					tapSet.add(x)
				})
				this.emit("pointerdown", event)
				break
			case "up":
				EventSystem.treeWalk(root, event.global, x => {
					if (!event.target) {
						event.target = x
					}
					x.emit("pointerup", event)
					if (tapSet.has(x)) {
						tapSet.delete(x)
						x.emit("pointertap", event)
					}
				})
				if (tapSet.size) {
					tapSet.forEach(x => x.interactive && x.emit("pointerupoutside", event))
					tapSet.clear()
				}
				this.emit("pointerup", event)
				this.emit("pointetap", event)
				break
			case "cancel":
				if (tapSet.size) {
					tapSet.forEach(x => x.interactive && x.emit("pointerupoutside", event))
					tapSet.clear()
				}
				this.emit("pointerup", event)
				break
		}
	}

	public destroy() {
		if (this._tickerUpdate) {
			Ticker.system.remove(this._tickerUpdate)
			this._tickerUpdate = undefined
		}
		const view = this.renderer.view
		view.style.removeProperty("touch-action")

		const options = { capture: true, passive: false }
		document.addEventListener("pointermove", this._onPointerMove, options)
		view.addEventListener("pointerdown", this._onPointerDown, options)
		globalThis.addEventListener("pointercancel", this._onPointerCancel, options)
		globalThis.addEventListener("pointerup", this._onPointerUp, options)
	}

	private setCursorMode(mode: "auto" | "forced" | "disabled", cursor: string) {
		if (mode == "auto") {
			this._lastCursor = ""
		} else if (mode == "forced") {
			this._lastCursor = cursor || "default"
			this.renderer.view.style.cursor = this._lastCursor
		} else {
			this._lastCursor = ""
			this.renderer.view.removeAttribute("cursor")
		}
	}

	public get lastMoveEvent() {
		return this._lastMoveEvent
	}

	public get lastEvent() {
		return this._lastEvent
	}

	public get cursor() {
		return this._cursor
	}

	public set cursor(value: string) {
		this._cursor = value
		this.setCursorMode(this._cursorControl, value)
	}

	public get cursorControl() {
		return this._cursorControl
	}

	public set cursorControl(value: "auto" | "forced" | "disabled") {
		this._cursorControl = value
		this.setCursorMode(value, this._cursor)
	}
}
