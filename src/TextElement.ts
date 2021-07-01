import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Text, TextStyle, TextMetrics, ITextStyle } from "@pixi/text"

export interface TextElementConfig extends BaseConfig {
	text?: string
	fit?: boolean
	verticalAlign?: "top" | "bottom" | "middle"
	style?: Partial<ITextStyle>
}

export class TextElement extends BaseElement {
	public readonly handle!: Text
	public static roundPixels = false
	public static resolution = 1

	private style: Partial<ITextStyle>
	private text!: string
	private textRect: [number, number] | null
	private _fit: boolean
	private _verticalAlign: "top" | "bottom" | "middle"
	private lastSize: [number, number]

	public constructor(name?: string, config?: TextElementConfig) {
		super(new Text(""), "text", name, config)
		this.textRect = null
		this.style = {}
		this.handle.roundPixels = TextElement.roundPixels
		this.handle.resolution = TextElement.resolution
		this._fit = false
		this._verticalAlign = "top"
		this.lastSize = [0, 0]
		if (config) {
			this.setText(config.text || "", config.style)
			if (config.style) {
				this.style = {...config.style}
				this.handle.style = this.style
			}
			if (config.text) {
				this.text = config.text
				this.handle.text = this.text
			}
			if (config.fit) {
				this._fit = true
			}
			if (config.verticalAlign) {
				this._verticalAlign = config.verticalAlign
			}
		}
	}

	public setDirty(forceFontRedraw?: boolean) {
		super.setDirty()
		const clearTextRect = (
			forceFontRedraw ||
			(this.style.wordWrap && (!this.widthReady || (this.width != this.lastSize[0]))) ||
			(this._fit && (!this.widthReady || this.lastSize[0] != this.width || !this.heightReady || this.lastSize[1] != this.height))
		)
		if (clearTextRect) {
			this.textRect = null
		}
	}

	private meausreText() {
		if (this.style.wordWrap) {
			if (this.style.wordWrapWidth != this.width) {
				this.style.wordWrapWidth = this.width
				this.handle.style.wordWrapWidth = this.width
			}
		}
		const textMetrics = TextMetrics.measureText(this.text, new TextStyle(this.handle.style))
		this.textRect = [
			textMetrics.width,
			textMetrics.height
		]
	}

	public set resolution(value: number) {
		this.handle.resolution = value
		this.setDirty(true)
	}

	public get contentHeight() {
		if (!this.textRect) {
			this.meausreText()
		}
		return this.textRect![1]
	}

	public get contentWidth() {
		if (!this.textRect) {
			this.meausreText()
		}
		return this.textRect![0]
	}

	public get fit() {
		return this._fit
	}

	public set fit(value: boolean) {
		if (this._fit != value) {
			this._fit = value
			if (!value) {
				this.handle.style.fontSize = this.style.fontSize
			}
			this.setDirty(true)
		}
	}

	public get verticalAlign() {
		return this._verticalAlign
	}

	public set verticalAlign(value: "top" | "bottom" | "middle") {
		if (this._verticalAlign != value) {
			this._verticalAlign = value
			this.setDirty()
		}
	}

	private fitText(width: number, height: number) {
		const scale = Math.min(width / this.textRect![0], height / this.textRect![1])
		if (scale < 1) {
			this.handle.style.fontSize = Math.max(1, Math.floor(this.handle.style.fontSize as number * scale))
			this.meausreText()
		}
	}

	private fitWrappedText(width: number, height: number) {
		let upperBound = this.style.fontSize as number
		let lowerBound = upperBound * Math.min(width / this.textRect![0], height / this.textRect![1])
		let lastSize = upperBound
		if (lowerBound >= upperBound) {
			return
		}
		for (let i = 0; i < 8; i += 1) {
			const currentSize = Math.round((upperBound + lowerBound) / 2)
			if (currentSize == lastSize) {
				return
			}
			lastSize = currentSize
			this.handle.style.fontSize = currentSize
			this.meausreText()
			const scale = Math.min(width / this.textRect![0], height / this.textRect![1])
			if (scale > 1) {
				lowerBound = currentSize
				upperBound = currentSize * scale
			} else {
				upperBound = currentSize
				lowerBound = currentSize * scale
			}
		}
		this.fitText(width, height)
	}

	protected onUpdate() {
		super.onUpdate()
		const width = this.width
		const height = this.height
		if (this._fit && !this.textRect) {
			this.handle.style.fontSize = this.style.fontSize
			this.meausreText()
			if (this.style.wordWrap) {
				this.fitWrappedText(width, height)
			} else {
				this.fitText(width, height)
			}
		}
		this.lastSize[0] != this.width
		this.lastSize[1] != this.height
		this.handle.pivot.set(width / 2, height / 2)
		let left = this.computedLeft
		let top = this.computedTop
		if (this._verticalAlign == "middle") {
			top += (this.height - this.contentHeight) / 2
		} else if (this._verticalAlign == "bottom") {
			top += (this.height - this.contentHeight)
		}
		if (this.style.align == "center") {
			left += (this.width - this.contentWidth) / 2
		} else if (this.style.align == "right") {
			left += (this.width - this.contentWidth)
		}
		this.handle.position.set(left, top)
	}

	public setStyle(style?: Partial<ITextStyle>) {
		if (style) {
			Object.assign(this.style, style)
		}
		this.handle.style = this.style
		this.setDirty(true)
	}

	public setText(text: string, style?: Partial<ITextStyle>) {
		this.text = text
		this.handle.text = this.text
		if (style) {
			this.setStyle(style)
		}
		this.setDirty(true)
	}
}

layoutFactory.register("text", (name, config) => new TextElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		text: {config: TextElementConfig, element: TextElement}
	}
}
