import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { SdfText, SdfTextStyle } from "./sdfText/index.js"
import { Rectangle } from "@pixi/math"

export interface SdfTextElementConfig<T extends SdfTextElement = SdfTextElement> extends BaseConfig<T> {
	text?: string
	fit?: boolean
	verticalAlign?: "top" | "bottom" | "middle"
	horizontalAlign?: "left" | "right" | "center"
	wordWrap?: boolean
	flush?: boolean
	forceBatch?: boolean
	style?: Partial<SdfTextStyle>
}

export class SdfTextElement extends BaseElement {
	declare public readonly handle: SdfText

	private _fit: boolean
	private _verticalAlign: "top" | "bottom" | "middle" | "baseline"
	private _horizontalAlign: "left" | "right" | "center"
	private _lastSize: [number, number]
	private _wordWrap: boolean

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("text-sdf", props => new this(props, new SdfText()))
	}

	protected constructor(props: BaseConstructorProperties<SdfTextElementConfig<any>>, handle: SdfText) {
		super(props, handle)
		this._fit = false
		this._verticalAlign = "top"
		this._horizontalAlign = "left"
		this._lastSize = [0, 0]
		this._wordWrap = false
		const config = props.config
		if (config) {
			if (config.style) {
				this.handle.updateStyle(config.style)
			}
			if (config.text) {
				this.handle.text = config.text
			}
			if (config.fit) {
				this._fit = true
			}
			if (config.verticalAlign) {
				this._verticalAlign = config.verticalAlign
			}
			if (config.horizontalAlign) {
				this._horizontalAlign = config.horizontalAlign
			}
			if (config.wordWrap) {
				this._wordWrap = true
			}
			if (config.flush !== undefined) {
				this.handle.flush = config.flush
			}
			if (config.forceBatch !== undefined) {
				this.handle.flush = config.forceBatch
			}
		}
	}

	public get contentHeight() {
		return this.handle.height
	}

	public get contentWidth() {
		return this.handle.width
	}

	public get fit() {
		return this._fit
	}

	public set fit(value: boolean) {
		if (this._fit != value) {
			this._fit = value
			this._lastSize[0] = -1
			this._lastSize[1] = -1
			this.setDirty()
		}
	}

	public get verticalAlign() {
		return this._verticalAlign
	}

	public set verticalAlign(value: "top" | "bottom" | "middle" | "baseline") {
		if (this._verticalAlign != value) {
			this._verticalAlign = value
			this.setDirty()
		}
	}

	public get horizontalAlign() {
		return this._horizontalAlign
	}

	public set horizontalAlign(value: "left" | "right" | "center") {
		if (this._horizontalAlign != value) {
			this._horizontalAlign = value
			this.setDirty()
		}
	}

	public get wordWrap() {
		return this._wordWrap
	}

	public set wordWrap(value: boolean) {
		if (this._wordWrap != value) {
			this._wordWrap = value
			this.setDirty()
		}
	}

	public get text() {
		return this.handle.text
	}

	public set text(value: string) {
		if (this.handle.text != value) {
			this.handle.text = value
			this.setDirty()
		}
	}

	public get flush() {
		return this.handle.flush
	}

	public set flush(value: boolean) {
		this.handle.flush = value
	}

	public get forceBatch() {
		return this.handle.flush
	}

	public set forceBatch(value: boolean) {
		this.handle.forceBatch = value
	}

	public setStyle(style: Partial<SdfTextStyle>) {
		this.handle.setStyle(style)
		this.setDirty()
	}

	public updateStyle(style: Partial<SdfTextStyle>) {
		this.handle.updateStyle(style)
		this.setDirty()
	}

	private fitWrappedText(width: number, height: number) {
		let upperBound = 1
		let lowerBound = Math.min(width / this.handle.width, height / this.handle.height)
		let lastSize = upperBound
		if (lowerBound >= upperBound) {
			return
		}
		for (let i = 0; i < 8; i += 1) {
			const currentSize = (upperBound + lowerBound) / 2
			this.handle.fontScale = currentSize
			if (Math.abs(currentSize - lastSize) < 0.05) {
				return
			}
			lastSize = currentSize
			const scale = Math.min(width / this.handle.width, height / this.handle.height)
			if (scale > 1) {
				lowerBound = currentSize
				upperBound = currentSize * scale
			} else {
				upperBound = currentSize
				lowerBound = currentSize * scale
			}
		}
	}

	protected onUpdate() {
		super.onUpdate()
		const width = this.width
		const height = this.height
		this.handle.wordWrapWidth = (this._wordWrap && this.widthReady) ? width : 0
		this.handle.fontScale = 1
		if (this.handle.dirty || width != this._lastSize[0] || height != this._lastSize[1]) {
			if (this._fit) {
				if (this._wordWrap) {
					this.fitWrappedText(width, height)
				} else {
					this.handle.fontScale = Math.min(1, width / this.handle.width, height / this.handle.height)
				}
			}
		}
		this._lastSize[0] = this.width
		this._lastSize[1] = this.height
		let left = 0
		let top = 0
		if (this._verticalAlign == "middle") {
			top = (this.height - this.contentHeight) / 2
		} else if (this._verticalAlign == "baseline") {
			top = (this.height - this.contentHeight - 2 * this.handle.baseLineOffset) / 2
		} else if (this._verticalAlign == "bottom") {
			top = this.height - this.contentHeight
		}
		if (this._horizontalAlign == "center") {
			left = (this.width - this.contentWidth) / 2
		}
		else if (this._horizontalAlign == "right") {
			left = this.width - this.contentWidth
		}
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.pivot.set(width * this.pivot[0] - left, height * this.pivot[1] - top)
		this.handle.scale.set(this._scale)
		this.applyFlip()
		this.handle.position.set(this.computedLeft, this.computedTop)
	}
}

export default SdfTextElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"text-sdf": {config: SdfTextElementConfig, element: SdfTextElement}
	}
}
