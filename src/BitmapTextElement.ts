import { BaseElement, BaseElementConfig } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { IBitmapTextStyle, BitmapText, BitmapFont, BitmapFontData } from "@pixi/text-bitmap"
import { Texture } from "@pixi/core"
import { Rectangle } from "@pixi/math"

export interface BitmapTextElementConfig extends BaseElementConfig<"text-bitmap", BitmapTextElement> {
	text?: string
	fit?: boolean
	verticalAlign?: "top" | "bottom" | "middle"
	style?: Partial<IBitmapTextStyle & {wordWrap: boolean}>
}

export class BitmapTextElement extends BaseElement<BitmapText> {
	public static register(factory: PixiLayoutFactory) {
		if (!("null" in BitmapFont.available)) {
			const data = new BitmapFontData()
			data.common.push({lineHeight: 0})
			data.info.push({face: "null", size: 1})
			data.page.push({file: "", id: 0})
			BitmapFont.install(data, Texture.EMPTY)
		}
		factory.register("text-bitmap", props => new this(factory, props))
	}

	private style: Partial<IBitmapTextStyle & {wordWrap: boolean}>
	private _text!: string
	private textRect: [number, number] | null
	private _fit: boolean
	private _verticalAlign: "top" | "bottom" | "middle"
	private lastSize: [number, number]

	private constructor(factory: PixiLayoutFactory, config: Readonly<BitmapTextElementConfig>) {
		super(factory, config, new BitmapText("", {fontName: "null"}))
		this.textRect = null
		this.style = {}
		this._fit = false
		this._verticalAlign = "top"
		this.lastSize = [0, 0]
		this._text = ""
		if (config.style) {
			this.style = {...config.style}
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
	}

	private get maxWidth() {
		if (!this.style.wordWrap) {
			return 0
		} else if (this.style.maxWidth) {
			return this.style.maxWidth
		} else {
			return this.computedWidth
		}
	}

	private meausreText(fontSize: number) {
		if (!this._text || !this.style.fontName) {
			this.textRect = [0, 0]
			return
		}

		const data = BitmapFont.available[this.style.fontName]

		const scale = fontSize / data.size
		const text = this._text.replace(/(?:\r\n|\r)/g, "\n") || " "
		const maxWidth = this.maxWidth / scale
		const letterSpacing = this.style.letterSpacing || 0

		let x = 0
		let y = 0
		let prevCharCode = null
		let lastLineWidth = 0
		let maxLineWidth = 0
		let lastBreakPos = -1
		let lastBreakWidth = 0

		for (let i = 0; i < text.length; i++) {
			const char = text[i]
			const charCode = text.codePointAt(i)!

			if ((/(?:\s)/).test(char)) {
				lastBreakPos = i
				lastBreakWidth = lastLineWidth
			}

			if (char === "\n") {
				maxLineWidth = Math.max(maxLineWidth, lastLineWidth)
				x = 0
				y += data.lineHeight
				prevCharCode = null
				continue
			}

			const charData = data.chars[charCode]

			if (!charData) {
				continue
			}

			if (prevCharCode && charData.kerning[prevCharCode]) {
				x += charData.kerning[prevCharCode]
			}

			lastLineWidth = (x + charData.xOffset + (letterSpacing / 2)) + charData.texture.orig.width
			x += charData.xAdvance + letterSpacing
			prevCharCode = charCode

			if (lastBreakPos !== -1 && maxWidth > 0 && x > maxWidth) {
				i = lastBreakPos
				lastBreakPos = -1
				maxLineWidth = Math.max(maxLineWidth, lastBreakWidth)
				x = 0
				y += data.lineHeight
				prevCharCode = null
			}
		}

		const lastChar = text[text.length - 1]
		if (lastChar !== "\n") {
			if ((/(?:\s)/).test(lastChar)) {
				lastLineWidth = lastBreakWidth
			}
			maxLineWidth = Math.max(maxLineWidth, lastLineWidth)
		}

		this.textRect = [
			maxLineWidth * scale,
			(y + data.lineHeight) * scale
		]
	}

	public get contentHeight() {
		return this.textRect![1]
	}

	public get contentWidth() {
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

	public setStyle(style: Partial<IBitmapTextStyle & {wordWrap: boolean}>) {
		this.style = {...style}
		this.textRect = null
		this.setDirty()
	}

	public updateStyle(style: Partial<IBitmapTextStyle & {wordWrap: boolean}>) {
		Object.assign(this.style, style)
		this.textRect = null
		this.setDirty()
	}

	public setText(text: string, style?: Partial<IBitmapTextStyle & {wordWrap: boolean}>) {
		this._text = text
		if (style) {
			this.style = {...style}
		}
		this.textRect = null
		this.setDirty()
	}

	private fitText(width: number, height: number, fontSize: number) {
		const scale = Math.min(width / this.textRect![0], height / this.textRect![1])
		if (scale < 1) {
			const result = Math.max(1, Math.floor(fontSize * scale))
			this.meausreText(result)
			this.handle.fontSize = result
		} else {
			this.handle.fontSize = fontSize
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
				this.handle.fontSize = currentSize
				return
			}
			lastSize = currentSize
			this.meausreText(currentSize)
			const scale = Math.min(width / this.textRect![0], height / this.textRect![1])
			if (scale > 1) {
				lowerBound = currentSize
				upperBound = currentSize * scale
			} else {
				upperBound = currentSize
				lowerBound = currentSize * scale
			}
		}
		this.fitText(width, height, lastSize)
	}

	protected redraw() {
		const skipRedraw = (
			this.textRect && (
				!this.dirty || !(
					(this.style.wordWrap && (this.computedWidth != this.lastSize[0])) ||
					(this._fit && (this.lastSize[0] != this.computedWidth || this.lastSize[1] != this.computedHeight))
				)
			)
		)

		if (skipRedraw) {
			return
		}
	
		this.handle.text = this._text
		this.handle.fontName = this.style.fontName || "null"
		this.handle.align = this.style.align || "left"
		this.handle.tint = this.style.tint === undefined ? 0xFFFFFF : this.style.tint
		this.handle.maxWidth = this.maxWidth
		this.handle.letterSpacing = this.style.letterSpacing || 0
		this.handle.fontSize = this.style.fontSize || 1
		this.meausreText(this.style.fontSize || 1)

		if (this._fit) {
			const width = this.hasWidth ? this.computedWidth : Infinity
			const height = this.hasHeight ? this.computedHeight : Infinity
			if (this.style.wordWrap) {
				this.fitWrappedText(width, height)
			} else {
				this.fitText(width, height, this.style.fontSize || 1)
			}
		}
	}

	protected onUpdate() {
		this.redraw()
		const width = this.computedWidth
		const height = this.computedHeight
		this.lastSize[0] = width
		this.lastSize[1] = height
		this.handle.pivot.set(width * this._xPivot, height * this._yPivot)
		let left = this.pivotedLeft
		let top = this.pivotedTop
		if (this._verticalAlign == "middle") {
			top += (height - this.contentHeight) * (this._scale / 2)
		} else if (this._verticalAlign == "bottom") {
			top += (height - this.contentHeight) * this._scale
		}
		if (this.style.align == "center") {
			left += (width - this.contentWidth) * (this._scale / 2)
		} else if (this.style.align == "right") {
			left += (width - this.contentWidth) * this._scale
		}
		if (this.handle.interactive) {
			this.handle.hitArea = new Rectangle(0, 0, width, height)
		}
		this.handle.scale.set(this._scale)
		this.applyFlip()
		this.handle.position.set(left, top)
	}
}

export default BitmapTextElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"text-bitmap": BitmapTextElementConfig
	}
}
