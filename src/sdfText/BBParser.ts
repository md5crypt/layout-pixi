import { SdfTextStyle } from "./SdfTextStyle.js"

export const enum Ascii {
	NEW_LINE = 10,
	CARRIAGE_RETURN = 13,
	SPACE = 32,
}

const enum BBParserGroups {
	ESCAPE = 1,
	WHITE_SPACE,
	TEXT,
	OTAG,
	OTAG_VALUE,
	CTAG
}

export class RichText<T extends RichTextChar = RichTextChar> {
	private static charPool: RichTextChar[] = []

	private _defaults = {} as SdfTextStyle
	private _chars: T[] = []

	public get defaults() {
		return this._defaults
	}

	public set defaults(value: SdfTextStyle) {
		Object.assign(this._defaults, value)
	}

	public get chars() {
		return this._chars
	}

	public createStyle(source?: SdfTextStyle) {
		const style = Object.create(this._defaults)
		if (source && source != this._defaults) {
			Object.assign(style, source)
		}
		return style as SdfTextStyle
	}

	public add(symbol: number, style: SdfTextStyle) {
		const char = (RichText.charPool.pop() || {}) as T
		char.symbol = symbol
		char.style = style
		this._chars.push(char)
	}

	public destroy() {
		for (let i = 0; i < this._chars.length; i += 1) {
			RichText.charPool.push(this._chars[i])
		}
		this._chars = null as any
	}
}

export interface RichTextChar {
	style: SdfTextStyle
	symbol: number
}

export class BBParser {
	static ALIGN_VALUES = ["left", "center", "right", "justify"]

	static parse<T extends RichText = RichText>(text: string) {
		const re = /\\(.)|(\s+)|([^\\\[]+)|\[([a-zA-Z]+)(?:=([a-zA-Z0-9#.-]+))?\]|\[\/([a-zA-Z]+)\]|./g
		const richText = new RichText()
		let styleStack = []
		let currentStyle = richText.defaults
		while (true) {
			const match = re.exec(text)
			if (!match) {
				break
			}
			if (match[BBParserGroups.ESCAPE]) {
				richText.add(match[BBParserGroups.ESCAPE].charCodeAt(0), currentStyle)
			} else if (match[BBParserGroups.WHITE_SPACE]) {
				const str = match[BBParserGroups.WHITE_SPACE]
				for (let i = 0; i < str.length; i += 1) {
					const code = str.charCodeAt(i)
					if (code == Ascii.CARRIAGE_RETURN) {
						/* no op */
					} else if (code == Ascii.NEW_LINE) {
						richText.add(Ascii.NEW_LINE, currentStyle)
					} else {
						richText.add(Ascii.SPACE, currentStyle)
					}
				}
			} else if (match[BBParserGroups.TEXT]) {
				const str = match[BBParserGroups.TEXT]
				for (let i = 0; i < str.length; i += 1) {
					richText.add(str.charCodeAt(i), currentStyle)
				}
			} else if (match[BBParserGroups.OTAG]) {
				styleStack.push(currentStyle)
				currentStyle = richText.createStyle(currentStyle)
				const tag = match[BBParserGroups.OTAG]
				const value = match[BBParserGroups.OTAG_VALUE]
				switch(tag) {
					case "font":
						if (value) {
							currentStyle.fontName = value
						}
						break
					case "color":
						if (value) {
							currentStyle.tint = parseInt(value.slice(1), 16)
						}
						break
					case "size":
						if (value) {
							currentStyle.fontSize = parseFloat(value)
						}
						break
					case "scale":
						if (value) {
							currentStyle.fontScale = parseFloat(value)
						}
						break
					case "lineSpacing":
					case "letterSpacing":
						if (value) {
							currentStyle[tag] = parseFloat(value)
						}
						break
					case "align":
						if (this.ALIGN_VALUES.includes(value)) {
							currentStyle.align = value as "left"
						}
						break
					default:
						console.warn("invalid bb tag: ", match[0])
				}
			} else if (match[BBParserGroups.CTAG]) {
				if (styleStack.length > 0) {
					currentStyle = styleStack.pop()!
				} else {
					console.warn("failed to close bb tag: ", match[BBParserGroups.CTAG])
				}
			} else {
				richText.add(match[0].charCodeAt(0), currentStyle)
				console.warn("invalid bb token: ", match[0])
			}
		}
		richText.add(Ascii.NEW_LINE, currentStyle)
		return richText as T
	}
}

export default BBParser
