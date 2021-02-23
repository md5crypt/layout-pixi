import { BaseElement, BaseConfig, layoutFactory } from "./BaseElement"
import { Text, TextStyle, TextMetrics, ITextStyle } from "@pixi/text"

export interface TextElementConfig extends BaseConfig {
	text?: string
	style?: Partial<ITextStyle>
}

export class TextElement extends BaseElement {
	public readonly handle!: Text

	private style: Partial<ITextStyle>
	private text: string
	private textRect: [number, number] | null

	public constructor(name?: string, config?: TextElementConfig) {
		super(new Text(""), name, config)
		this.textRect = null
		this.style = {}
		this.text = ""
		if (config) {
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
		const textMetrics = TextMetrics.measureText(this.text, new TextStyle(this.style))
		this.textRect = [
			textMetrics.width,
			textMetrics.height
		]
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

	public setText(text: string, style?: Partial<ITextStyle>) {
		if (style) {
			Object.assign(this.style, style)
		}
		this.text = text
		this.handle.text = this.text
		this.handle.style = this.style
		this.setDirty()
	}
}

layoutFactory.register("text", (name, config) => new TextElement(name, config))

declare module "./ElementTypes" {
	export interface ElementTypes {
		text: {config: TextElementConfig, element: TextElement}
	}
}
