import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { Text, TextStyle, TextMetrics, ITextStyle } from "@pixi/text"

export interface TextElementConfig<T extends TextElement = TextElement> extends BaseConfig<T> {
	text?: string
	fit?: boolean
	verticalAlign?: "top" | "bottom" | "middle"
	style?: Partial<ITextStyle>
	resolution?: number
	roundPixels?: boolean
}

export class TextElement extends BaseElement {
	declare public readonly handle: Text

	private _style: Partial<ITextStyle>
	private _text!: string
	private textRect: [number, number] | null
	private _fit: boolean
	private _verticalAlign: "top" | "bottom" | "middle"
	private lastSize: [number, number]
	private _resolution: number
	private needsRedraw: boolean

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("text", props => new this(props, new Text("")))
	}

	protected constructor(props: BaseConstructorProperties<TextElementConfig<any>>, handle: Text) {
		super(props, handle)
		this.textRect = null
		this._style = {}
		this._fit = false
		this._verticalAlign = "top"
		this.lastSize = [0, 0]
		this._resolution = 1
		this._text = ""
		this.needsRedraw = true
		const config = props.config
		if (config) {
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
			if (config.resolution) {
				this._resolution = config.resolution
			}
		}
	}

	public setDirty(force?: boolean) {
		this.needsRedraw = true
		return super.setDirty(force)
	}

	public onScaleChange(scale: number) {
		super.onScaleChange(scale)
		const resolution = this._resolution * this._parentScale
		if (this.handle.resolution != resolution) {
			this.handle.resolution = resolution
			this.textRect = null
			this.setDirty()
		}
	}

	private meausreText() {
		if (!this._text) {
			this.textRect = [0, 0]
		} else {
			if (this._style.wordWrap && this.widthReady) {
				if (this._style.wordWrapWidth != this.width) {
					this._style.wordWrapWidth = this.width
					this.handle.style.wordWrapWidth = this.width
				}
			}
			const textMetrics = TextMetrics.measureText(this._text, new TextStyle(this.handle.style))
			this.textRect = [
				textMetrics.width,
				textMetrics.height
			]
		}
	}

	public set resolution(value: number) {
		this._resolution = value
		this.handle.resolution = this._resolution * this._parentScale
		this.textRect = null
		this.setDirty()
	}

	public get resolution() {
		return this._resolution
	}

	public get contentHeight() {
		if (this.needsRedraw) {
			this.redraw()
		}
		return this.textRect![1]
	}

	public get contentWidth() {
		if (this.needsRedraw) {
			this.redraw()
		}
		return this.textRect![0]
	}

	public get fit() {
		return this._fit
	}

	public set fit(value: boolean) {
		if (this._fit != value) {
			this._fit = value
			this.textRect = null
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
		this.textRect = null
		this.setDirty()
	}

	public get style() {
		return this._style as Readonly<Partial<ITextStyle>>
	}

	public setStyle(style: Partial<ITextStyle>) {
		this._style = {...style}
		this.textRect = null
		this.setDirty()
	}

	public updateStyle(style: Partial<ITextStyle>) {
		Object.assign(this._style, style)
		this.textRect = null
		this.setDirty()
	}

	public setText(text: string, style?: Partial<ITextStyle>) {
		this._text = text
		if (style) {
			this._style = {...style}
		}
		this.textRect = null
		this.setDirty()
	}

	private updateFontSize(value: number) {
		this.handle.style.fontSize = value
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
			// multiply dropShadowDistance by resolution to fix a bug in PIXI code
			this.handle.style.dropShadowDistance = (this._style.dropShadowDistance * scale) * (this._resolution * this._parentScale)
		}
		if (this._style.dropShadowBlur) {
			this.handle.style.dropShadowBlur = this._style.dropShadowBlur * scale
		}
	}

	private fitText(width: number, height: number) {
		const scale = Math.min(width / this.textRect![0], height / this.textRect![1])
		if (scale < 1) {
			this.updateFontSize(Math.max(1, Math.floor(this.handle.style.fontSize as number * scale)))
			this.meausreText()
		}
	}

	private fitWrappedText(width: number, height: number) {
		let upperBound = this._style.fontSize as number
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
			this.updateFontSize(currentSize)
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

	protected redraw() {
		const skipRedraw = (
			this.textRect && (
				!this.needsRedraw || !(
					(this._style.wordWrap && (!this.widthReady || (this.width != this.lastSize[0]))) ||
					(this._fit && (!this.widthReady || this.lastSize[0] != this.width || !this.heightReady || this.lastSize[1] != this.height))
				)
			)
		)
		if (skipRedraw) {
			return
		}
		this.needsRedraw = false
		this.handle.text = this._text
		this.handle.style = this._style
		if (this._style.dropShadowDistance) {
			// multiply dropShadowDistance by resolution to fix a bug in PIXI code
			this.handle.style.dropShadowDistance = this._style.dropShadowDistance * (this._resolution * this._parentScale)
		}
		this.meausreText()
		if (this._fit) {
			const width = this.widthReady ? this.width : Infinity
			const height = this.heightReady ? this.height : Infinity
			if (this._style.wordWrap) {
				this.fitWrappedText(width, height)
			} else {
				this.fitText(width, height)
			}
		}
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.needsRedraw) {
			this.redraw()
		}
		const width = this.width
		const height = this.height
		this.lastSize[0] = this.width
		this.lastSize[1] = this.height
		this.handle.pivot.set(width * this.pivot[0], height * this.pivot[1])
		let left = this.computedLeft
		let top = this.computedTop
		if (this._verticalAlign == "middle") {
			top += (this.height - this.contentHeight) * (this._scale / 2)
		} else if (this._verticalAlign == "bottom") {
			top += (this.height - this.contentHeight) * this._scale
		}
		if (this._style.align == "center") {
			left += (this.width - this.contentWidth) * (this._scale / 2)
		} else if (this._style.align == "right") {
			left += (this.width - this.contentWidth) * this._scale
		}
		this.handle.scale.set(this._scale)
		this.applyFlip()
		this.handle.position.set(left, top)
	}
}

export default TextElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		text: {config: TextElementConfig, element: TextElement}
	}
}
