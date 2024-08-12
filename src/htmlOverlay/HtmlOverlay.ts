import { Renderer } from "@pixi/core"
import { DisplayObject } from "@pixi/display"

export class HtmlOverlay extends DisplayObject {
	public static dpi = window.devicePixelRatio

	private static _attached = new Set<HtmlOverlay>()
	private static _paint = 0

	public static prune() {
		for (const item of this._attached) {
			if (item._paint != this._paint) {
				if (item.persistent) {
					item._enabled = false
					item._htmlRoot.style.display = "none"
				} else {
					item.detach()
				}
			}
		}
		this._paint += 1
	}

	// pixi types require this
	public sortDirty!: boolean

	public persistent: boolean

	public onContentChanged?: (root: HTMLDivElement) => void

	private _htmlRoot: HTMLDivElement

	private _style: string
	private _content: string

	private _styleElement: HTMLStyleElement
	private _contentElement: HTMLDivElement

	private _lastTransformWorldId: number

	private _width: number
	private _height: number

	private _lastAlpha: number
	private _lastZIndex: number

	private _dimensionsDirty: boolean
	private _styleDirty: boolean
	private _contentDirty: boolean
	private _attached: boolean
	private _interactiveChildren: boolean

	private _paint: number
	private _enabled: boolean

	constructor() {
		super()
		this._htmlRoot = document.createElement("div")
		Object.assign(this._htmlRoot.style, {
			position: "absolute",
			top: "0",
			left: "0",
			transformOrigin: "0px 0px 0px",
			display: "none"
		})
		const shadowRoot = this._htmlRoot.attachShadow({mode: "closed"})
		this._styleElement = document.createElement("style")
		this._contentElement = document.createElement("div")
		this._contentElement.id = "root"
		shadowRoot.appendChild(this._styleElement)
		shadowRoot.appendChild(this._contentElement)
		this._lastTransformWorldId = -1
		this._lastAlpha = 1
		this._lastZIndex = 0
		this._dimensionsDirty = false
		this._styleDirty = false
		this._contentDirty = false
		this._attached = false
		this._width = 0
		this._height = 0
		this._style = ""
		this._content = ""
		this._interactiveChildren = true
		this._paint = 0
		this.persistent = false
		this._enabled = false
	}

	public calculateBounds() {
		// no-op
	}

	public removeChild(child: DisplayObject) {
		// no-op
	}

	public render(renderer: Renderer) {
		if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
			return
		}

		const style = this._htmlRoot.style

		if (this.transform._worldID != this._lastTransformWorldId) {
			this._lastTransformWorldId = this.transform._worldID
			const wt = this.transform.worldTransform
			const dpi = HtmlOverlay.dpi
			style.transform = `matrix(${wt.a / dpi},${wt.b / dpi},${wt.c / dpi},${wt.d / dpi},${wt.tx / dpi},${wt.ty / dpi})`
		}

		if (this._dimensionsDirty) {
			this._dimensionsDirty = false
			style.width = this._width + "px"
			style.height = this._height + "px"
		}

		if (this._lastAlpha != this.worldAlpha) {
			this._lastAlpha = this.worldAlpha
			style.opacity = this.worldAlpha.toString()
		}

		if (this._zIndex != this._lastZIndex) {
			this._lastZIndex = this._zIndex
			style.zIndex = this._zIndex.toString()
		}

		if (this._styleDirty) {
			this._styleDirty = false
			this._styleElement.innerHTML = this._style
		}

		if (this._contentDirty) {
			this._contentDirty = false
			this._contentElement.innerHTML = this._content
			if (this.onContentChanged) {
				this.onContentChanged(this._contentElement)
			}
		}

		if (!this._enabled) {
			this._enabled = true
			style.removeProperty("display")
		}

		this.attach(renderer)

		this._paint = HtmlOverlay._paint
	}

	public attach(renderer: Renderer) {
		if (!this._attached) {
			this._attached = true
			renderer.view.parentNode!.appendChild(this._htmlRoot)
			HtmlOverlay._attached.add(this)
		}
	}

	public detach() {
		if (this._attached) {
			this._attached = false
			this._htmlRoot.remove()
			HtmlOverlay._attached.delete(this)
		}
	}

	public set width(value: number) {
		if (this._width != value) {
			this._width = value
			this._dimensionsDirty = true
		}
	}

	public get width() {
		return this._width
	}

	public set height(value: number) {
		if (this._height != value) {
			this._height = value
			this._dimensionsDirty = true
		}
	}

	public get height() {
		return this._height
	}

	public set style(value: string) {
		if (this._style != value) {
			this._style = value
			this._styleDirty = true
		}
	}

	public get style() {
		return this._style
	}

	public set content(value: string) {
		if (this._content != value) {
			this._content = value
			this._contentDirty = true
		}
	}

	public get content() {
		return this._content
	}

	public get htmlRoot() {
		return this._htmlRoot
	}

	public get contentElement() {
		return this._contentElement
	}

	public get interactiveChildren() {
		return this._interactiveChildren
	}

	public set interactiveChildren(value: boolean) {
		if (this._interactiveChildren != value) {
			this._interactiveChildren = value
			if (value) {
				this._htmlRoot.style.removeProperty("pointer-events")
			} else {
				this._htmlRoot.style.pointerEvents = "none"
			}
		}
	}
}
