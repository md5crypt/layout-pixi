import { BaseElement, BaseElementConfig, BlendMode } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { Text, TextStyle, TextMetrics, ITextStyle } from "@pixi/text"

export interface TextElementConfig extends BaseElementConfig<"text", TextElement> {
	text?: string
	fit?: boolean
	verticalAlign?: "top" | "bottom" | "middle"
	style?: Partial<ITextStyle>
	resolution?: number
	roundPixels?: boolean
	blendMode?: BlendMode
	tint?: number
}

class PatchedText extends Text {
	private _masterResolution = 1
	private _resolutionCache = 1

	updateTransform() {
		const transform = this.parent.transform.worldTransform
		const resolution = this._masterResolution * Math.sqrt(transform.a * transform.a + transform.b * transform.b)
		if (this._resolutionCache != this._masterResolution) {
			this._resolutionCache = resolution * this._masterResolution
			super.resolution = resolution
		}
		super.updateTransform()
	}

	public set resolution(value: number) {
		this._masterResolution = value
	}

	public get resolution() {
		return this._masterResolution
	}
}

export class TextElement extends BaseElement<Text> {
	public static defaultResolution = 2

	public static register(factory: PixiLayoutFactory) {
		factory.register("text", config => new this(factory, config))
	}

	private _style: Partial<ITextStyle>
	private _text!: string
	private _textRect: [number, number] | null
	private _fit: boolean
	private _verticalAlign: "top" | "bottom" | "middle"
	private _lastSize: [number, number]

	protected constructor(factory: PixiLayoutFactory, config: TextElementConfig) {
		super(factory, config, new PatchedText(""))
		this._textRect = null
		this._style = {}
		this._fit = false
		this._verticalAlign = "top"
		this._lastSize = [0, 0]
		this._text = ""
		this.resolution = config.resolution || TextElement.defaultResolution
		if (config.style) {
			this._style = {...config.style}
		}
		if (config.text) {
			this._text = config.text
		}
		if (config.fit) {
			this._fit = true
		}
		if (config.verticalAlign) {
			this._verticalAlign = config.verticalAlign
		}
		if (config.roundPixels) {
			this.handle.roundPixels = config.roundPixels
		}
		if (config.blendMode !== undefined) {
			this.handle.blendMode = config.blendMode as number
		}
		if (config.tint !== undefined) {
			this.handle.tint = config.tint
		}
	}

	private meausreText() {
		if (!this._text || this.style.fontSize == 0) {
			this._textRect = [0, 0]
		} else {
			if (this._style.wordWrap) {
				const width = this.computedWidth
				if (this._style.wordWrapWidth != width) {
					this._style.wordWrapWidth = width
					this.handle.style.wordWrapWidth = width
				}
			}
			const textMetrics = TextMetrics.measureText(this._text, new TextStyle(this.handle.style))
			this._textRect = [
				textMetrics.width,
				textMetrics.height
			]
		}
	}

	public set resolution(value: number) {
		this.handle.resolution = value
	}

	public get resolution() {
		return this.handle.resolution
	}

	public get contentHeight() {
		return this._textRect![1]
	}

	public get contentWidth() {
		return this._textRect![0]
	}

	public get fit() {
		return this._fit
	}

	public set fit(value: boolean) {
		if (this._fit != value) {
			this._fit = value
			this._textRect = null
			this.setDirty()
		}
	}

	public get roundPixels() {
		return this.handle.roundPixels
	}

	public set roundPixels(value: boolean) {
		this.handle.roundPixels = value
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

	public get text() {
		return this._text
	}

	public set text(value: string) {
		this._text = value
		this._textRect = null
		this.setDirty()
	}

	public get tint() {
		return this.handle.tint
	}

	public set tint(value: number) {
		this.handle.tint = value
	}

	public get style() {
		return this._style as Readonly<Partial<ITextStyle>>
	}

	public setStyle(style: Partial<ITextStyle>) {
		this._style = {...style}
		this._textRect = null
		this.setDirty()
	}

	public updateStyle(style: Partial<ITextStyle>) {
		Object.assign(this._style, style)
		this._textRect = null
		this.setDirty()
	}

	public setText(text: string, style?: Partial<ITextStyle>) {
		this._text = text
		if (style) {
			this._style = {...style}
		}
		this._textRect = null
		this.setDirty()
	}

	public get blendMode() {
		return this.handle.blendMode as number as BlendMode
	}

	public set blendMode(value: BlendMode) {
		this.handle.blendMode = value as number
	}

	private updateFontSize(value: number) {
		this.handle.style.fontSize = Math.max(1, value)
		const scale = value / (this._style.fontSize as number)
		if (this._style.lineHeight) {
			this.handle.style.lineHeight = this._style.lineHeight * scale
		}
		if (this._style.leading) {
			this.handle.style.leading = this._style.leading * scale
		}
		if (this._style.letterSpacing) {
			this.handle.style.letterSpacing = this._style.letterSpacing * scale
		}
		if (this._style.strokeThickness) {
			this.handle.style.strokeThickness = this._style.strokeThickness * scale
		}
		if (this._style.dropShadowDistance) {
			this.handle.style.dropShadowDistance = this._style.dropShadowDistance * scale
		}
		if (this._style.dropShadowBlur) {
			this.handle.style.dropShadowBlur = this._style.dropShadowBlur * scale
		}
		if (this._style.padding) {
			this.handle.style.padding = this._style.padding * scale
		}
	}

	private fitText(width: number, height: number) {
		const scale = Math.min(width / this._textRect![0], height / this._textRect![1])
		if (scale < 1) {
			this.updateFontSize((this.handle.style.fontSize as number) * scale)
			this.meausreText()
		}
	}

	private fitWrappedText(width: number, height: number) {
		if (width == 0 || height == 0) {
			this.fitText(0, 0)
			return
		}
		let upperBound = this._style.fontSize as number
		let lowerBound = upperBound * height / this._textRect![1]
		let lastSize = upperBound
		if (lowerBound >= upperBound) {
			if (width < this._textRect![0]) {
				this.fitText(width, height)
			}
			return
		}
		let bestValue = lowerBound
		let bestScore = Math.abs(1 - height / this._textRect![1])
		for (let i = 0; i < 8; i += 1) {
			const currentSize = (upperBound + lowerBound) / 2
			lastSize = currentSize
			this.updateFontSize(currentSize)
			this.meausreText()
			const scale = height / this._textRect![1]
			const score = Math.abs(1 - scale)
			if (score < bestScore) {
				bestScore = score
				bestValue = currentSize
			}
			if (scale > 1) {
				lowerBound = currentSize
				upperBound = Math.min(upperBound, currentSize * scale * 1.25)
			} else if (scale < 1) {
				lowerBound = Math.max(lowerBound, currentSize * scale * 0.75)
				upperBound = currentSize
			} else {
				lowerBound = currentSize
				upperBound = currentSize
			}
			if (i > 4 ? bestScore < 0.05 : score < 0.025) {
				break
			}
		}
		if (lastSize != bestValue) {
			this.updateFontSize(bestValue)
			this.meausreText()
		}
		if (width < this._textRect![0]) {
			this.fitText(width, height)
		} else if (bestScore > 0.02) {
			const scale = height / this._textRect![1]
			if (scale < 1) {
				this.updateFontSize(Math.max(lowerBound, (this.handle.style.fontSize as number) * scale))
				this.meausreText()
			}
		}
	}

	protected redraw() {
		if (this._style.fontSize == 0 || !this.text) {
			this._textRect = [0, 0]
			return
		}
		const skipRedraw = (
			this._textRect && (
				!(
					(this._style.wordWrap && (this.computedWidth != this._lastSize[0])) ||
					(this._fit && (this._lastSize[0] != this.computedWidth || this._lastSize[1] != this.computedHeight))
				)
			)
		)
		if (skipRedraw) {
			return
		}
		this.handle.text = this._text
		this.handle.style = this._style
		this.meausreText()
		if (this._fit) {
			const width = this.hasWidth ? this.computedWidth : Infinity
			const height = this.hasHeight ? this.computedHeight : Infinity
			if (this._style.wordWrap) {
				this.fitWrappedText(width, height)
			} else {
				this.fitText(width, height)
			}
		}
	}

	protected onUpdate() {
		if (this.style.fontSize == 0 || !this.text) {
			this.handle.visible = false
			return
		}
		this.redraw()
		const width = this.computedWidth
		const height = this.computedHeight
		this._lastSize[0] = width
		this._lastSize[1] = height
		this.handle.visible = true
		let left = 0
		let top = 0
		if (this._verticalAlign == "middle") {
			top += (height - this.contentHeight) /2
		} else if (this._verticalAlign == "bottom") {
			top += height - this.contentHeight
		}
		if (this._style.align == "center") {
			left += (width - this.contentWidth) / 2
		} else if (this._style.align == "right") {
			left += width - this.contentWidth
		}
		this.handle.pivot.set(width * this._xPivot - left, height * this._yPivot - top)
		this.handle.scale.set(this._scale)
		this.applyFlip()
		this.handle.position.set(this.pivotedLeft, this.pivotedTop)
	}
}

export default TextElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		text: TextElementConfig
	}
}
