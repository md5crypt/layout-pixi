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
	canceled: boolean
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
	public readonly handleEvent: (e: MouseEvent) => any
	public autoPreventDefault: boolean
	public queueEvents: boolean
	private _lastCursor: string
	private _cursor: string
	private _cursorControl: "auto" | "forced" | "disabled"

	private _capturedEvents: PixiEvent[]
	private _pointerMoved: boolean
	private _lastMoveEvent: PixiEvent | null
	private _lastEvent: PixiEvent | null
	private _trackingData: Map<number, TrackingData>

	private _tickerUpdate?: () => void

	public constructor(renderer: Renderer) {
		super()
		this.renderer = renderer
		this.autoPreventDefault = false
		this.queueEvents = true
		this._pointerMoved = false
		this._lastMoveEvent = null
		this._lastEvent = null
		this._capturedEvents = []
		this._trackingData = new Map()
		this._cursorControl = "auto"
		this._lastCursor = ""
		this._cursor = ""

		this.handleEvent = (event: MouseEvent) => {
			if (this.autoPreventDefault) {
				event.preventDefault()
			}
			const pixiEvent = new PixiEvent(event, this.renderer)
			if (this.queueEvents) {
				this._capturedEvents.push(pixiEvent)
			} else {
				const lastObjectRendered = this.renderer._lastObjectRendered as DisplayObject
				if (!lastObjectRendered) {
					this._capturedEvents.push(pixiEvent)
				} else {
					this.processEvent(pixiEvent, lastObjectRendered)
					if (pixiEvent.__type == "pointermove") {
						this._pointerMoved = true
						this._lastMoveEvent = pixiEvent
					}
					this._lastEvent = pixiEvent
				}
			}
		}

		const view = this.renderer.view
		view.style.touchAction = "none"

		const options = { capture: true, passive: false }
		document.addEventListener("pointermove", this.handleEvent, options)
		document.addEventListener("wheel", this.handleEvent, options)
		view.addEventListener("pointerdown", this.handleEvent, options)
		globalThis.addEventListener("pointercancel", this.handleEvent, options)
		globalThis.addEventListener("pointerup", this.handleEvent, options)

		if (EventSystem.useGlobalTicker) {
			this._tickerUpdate = () => this.update()
			Ticker.system.add(this._tickerUpdate, undefined, EventSystem.globalTickerPriority)
		}
	}

	private getTrackingData(event: PixiEvent) {
		let data = this._trackingData.get(event.pointerId)
		if (!data) {
			data = {
				tapSet: new Set(),
				hoverSet: new Set(),
				canceled: false
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
		let pointerMoved = this._pointerMoved
		if (events.length) {
			for (let i = 0; i < events.length; i += 1) {
				const event = events[i]
				this.processEvent(event, lastObjectRendered)
				if (event.__type == "pointermove") {
					pointerMoved = true
					this._lastMoveEvent = event
				}
			}
			this._lastEvent = events[events.length - 1]
			this._capturedEvents = []
		}
		if (!pointerMoved && this._lastMoveEvent && this._lastMoveEvent.pointerType == "mouse") {
			this._lastMoveEvent.__type = "pointerupdate"
			this.processEvent(this._lastMoveEvent, lastObjectRendered)
		}
		this._pointerMoved = false
	}

	public cancelEvent(event: PixiEvent) {
		this.getTrackingData(event).canceled = true
	}

	public processEvent(event: PixiEvent, root: DisplayObject) {
		switch (event.__type) {
			case "pointerupdate":
				event.target = null
				/* falls through */
			case "pointermove":
				if (event.pointerType == "mouse") {
					const trackingData = this.getTrackingData(event)
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
						if (event.__type == "pointermove") {
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
				if (event.__type == "pointermove") {
					this.emit("pointermove", event)
				}
				break
			case "pointerdown": {
				const trackingData = this.getTrackingData(event)
				const tapSet = trackingData.tapSet
				trackingData.canceled = false
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
			}
			case "pointerup": {
				const trackingData = this.getTrackingData(event)
				const tapSet = trackingData.tapSet
				if (trackingData.canceled) {
					event.__type = "pointercancel"
					const tapSet = this.getTrackingData(event).tapSet
					if (tapSet.size) {
						tapSet.forEach(x => x.interactive && x.emit("pointerupoutside", event))
						tapSet.clear()
					}
					this.emit("pointerup", event)
				} else {
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
				}
				break
			}
			case "pointercancel": {
				const tapSet = this.getTrackingData(event).tapSet
				if (tapSet.size) {
					tapSet.forEach(x => x.interactive && x.emit("pointerupoutside", event))
					tapSet.clear()
				}
				this.emit("pointerup", event)
				break
			}
			case "wheel":
				EventSystem.treeWalk(root, event.global, x => {
					if (!event.target) {
						event.target = x
					}
					x.emit("wheel", event)
				})
				this.emit("wheel", event)
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
		document.removeEventListener("pointermove", this.handleEvent, options)
		view.removeEventListener("pointerdown", this.handleEvent, options)
		globalThis.removeEventListener("pointercancel", this.handleEvent, options)
		globalThis.removeEventListener("pointerup", this.handleEvent, options)
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
