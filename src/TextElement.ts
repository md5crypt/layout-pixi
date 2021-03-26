import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Text, TextStyle, TextMetrics, ITextStyle } from "@pixi/text"

export interface TextElementConfig extends BaseConfig {
	text?: string
	style?: Partial<ITextStyle>
}

export class TextElement extends BaseElement {
	public readonly handle!: Text
	public static roundPixels = false
	public static resolution = 1

	private style: Partial<ITextStyle>
	private text!: string
	private textRect: [number, number] | null

	public constructor(name?: string, config?: TextElementConfig) {
		super(new Text(""), name, config)
		this.textRect = null
		this.style = {}
		this.handle.roundPixels = TextElement.roundPixels
		this.handle.resolution = TextElement.resolution
		if (config) {
			this.setText(config.text || "", config.style)
			if (config.style) {
				this.style = config.style
				this.handle.style = config.style
			}
			if (config.text) {
				this.text = config.text
				this.handle.text = this.text
			}
		}
	}

	private meausreText() {
		const textMetrics = TextMetrics.measureText(this.text, new TextStyle(this.handle.style))
		this.textRect = [
			textMetrics.width,
			textMetrics.height
		]
	}

	public set resolution(value: number) {
		this.handle.resolution = value
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

	protected setDirty() {
		super.setDirty()
		this.textRect = null
	}

	protected onUpdate() {
		super.onUpdate()
		this.handle.position.set(this.left + this.width / 2, this.top + this.height / 2)
		this.handle.pivot.set(this.width / 2, this.height / 2)
		this.handle.x += this.config.padding.left
		this.handle.y += this.config.padding.top
	}

	public setStyle(style?: Partial<ITextStyle>) {
		if (style) {
			Object.assign(this.style, style)
		}
		this.handle.style = this.style
		if (this.style.wordWrap && !this.style.wordWrapWidth) {
			this.handle.style.wordWrapWidth = this._parent?.innerWidth
		}
		this.setDirty()
	}

	public setText(text: string, style?: Partial<ITextStyle>): void
	public setText(text: string, fit?: boolean, style?: Partial<ITextStyle>): void
	public setText(text: string, arg1?: boolean | Partial<ITextStyle>, arg2?: Partial<ITextStyle>) {
		this.text = text
		this.handle.text = this.text
		if (arg1 === true) {
			this.setStyle(arg2)
			this.fit()
		} else {
			this.setStyle(arg1 || arg2)
		}
	}

	public fit() {
		this.setStyle()
		this.parent.update()
		const scale = Math.min(this.parent.innerWidth / this.width, this.parent.innerHeight / this.height)
		if (scale < 1) {
			this.handle.style.fontSize = Math.floor((this.handle.style.fontSize as number) * scale)
			this.setDirty()
		}
	}
}

layoutFactory.register("text", (name, config) => new TextElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		text: {config: TextElementConfig, element: TextElement}
	}
}
