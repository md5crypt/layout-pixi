import { Renderer, Texture, BaseTexture } from "@pixi/core"
import { DisplayObject, IDestroyOptions } from "@pixi/display"
import { Rectangle } from "@pixi/math"
import { BBParser, Ascii, RichText, RichTextChar } from "./BBParser"
import { SdfFontData, SdfFontCharData } from "./SdfFontData"
import { SdfTextConstants, SdfTextRenderer, SdfTextRenderObject } from "./SdfTextRenderer"
import { SdfTextStyle } from "./SdfTextStyle"

interface InternalSdfFontCharData extends SdfFontCharData {
	texture: Texture | null
	kerning: Map<number, number> | null
}

interface InternalSdfFontData extends SdfFontData {
	charMap: Map<number, InternalSdfFontCharData>
}

interface CharRenderData extends RichTextChar {
	line: LineRenderData
	font: InternalSdfFontData
	charData: InternalSdfFontCharData | null
	tint: number
	scale: number
	xOffset: number
	x: number
	y: number
	width: number
	height: number
	uvs: Float32Array
	distance: number
	textureUid: number
}

interface LineRenderData {
	align: "left" | "center" | "right" | "justify"
	height: number
	baseLine: number
	width: number
	spaces: number
	alignOffset: number
	justifySpacer: number
	yOffset: number
	wrapped: boolean
}

export class SdfText extends DisplayObject implements SdfTextRenderObject {

	private static _fonts: Map<string, InternalSdfFontData> = new Map()
	private static _fontBaseTextures: Map<number, BaseTexture> = new Map()
	private static _linePool: LineRenderData[] = []

	public static styleDefaults: SdfTextStyle = {
		align: "left",
		tint: 0,
		letterSpacing: 0,
		lineSpacing: 0,
		fontName: "default",
		fontSize: 12,
		fontScale: 1
	}

	private static getLine() {
		const line = this._linePool.pop() || {} as LineRenderData
		line.height = 0
		line.width = 0
		line.baseLine = 0
		line.spaces = 0
		line.wrapped = false
		return line
	}

	public static isFontRegistered(name: string) {
		return this._fonts.has(name)
	}

	public static registerFontAlias(aliasName: string, target: string) {
		const font = this._fonts.get(target)
		if (!font) {
			throw new Error("font does not exist")
		}
		this._fonts.set(aliasName, font)
	}

	public static registerFont(data: SdfFontData, textures: Texture[], name?: string) {
		const charMap = new Map<number, InternalSdfFontCharData>()
		for (const texture of textures) {
			this._fontBaseTextures.set(texture.baseTexture.uid, texture.baseTexture)
		}
		for (let i = 0; i < data.chars.length; i += 1) {
			const char = data.chars[i] as InternalSdfFontCharData
			char.kerning = null
			const texture = textures[char.page]
			char.texture = (char.width > 0 && char.height > 0) ? new Texture(
				texture.baseTexture,
				new Rectangle(
					char.x + texture.frame.x,
					char.y + texture.frame.y,
					char.width,
					char.height
				),
				new Rectangle(
					0,
					0,
					char.width,
					char.height
				)
			) : null
			charMap.set(char.id, char)
		}
		for (const kerning of data.kernings) {
			const char = charMap.get(kerning.second)
			if (char){
				if (!char.kerning) {
					char.kerning = new Map()
				}
				char.kerning.set(kerning.first, kerning.amount)
			}
		}
		const output = data as InternalSdfFontData
		output.charMap = charMap
		this._fonts.set(name || output.info.face, output)
	}

	private _text: string
	private _textParsed: RichText<CharRenderData>

	private _wordWrapWidth: number
	private _style: SdfTextStyle

	private _textDirty: boolean
	private _dataDirty: boolean
	private _vertexData: Float32Array | null
	private _vertexDataSize: number
	private _cachedVertexData!: Float32Array
	private _lastTransformWorldId: number
	private _width: number
	private _height: number
	private _lines: LineRenderData[] | null
	private _fontScale: number
	private _baseLineOffset: number

	public sortDirty: boolean
	public flush: boolean
	public forceBatch: boolean

	constructor() {
		super()
		this._text = ""
		this._textParsed = new RichText()
		this._textDirty = true
		this._dataDirty = true
		this._wordWrapWidth = 0
		this._style = {...SdfText.styleDefaults}
		this._vertexData = null
		this._vertexDataSize = 0
		this._lastTransformWorldId = -1
		this.flush = false
		this.forceBatch = SdfTextRenderer.FORCE_BATCH
		this._width = 0
		this._height = 0
		this._lines = null
		this._fontScale = 1
		this._baseLineOffset = 0
		this.sortDirty = false
	}

	private generateCharRenderData() {
		const chars = this._textParsed.chars
		if (chars.length == 0) {
			return
		}

		const lines = [] as LineRenderData[]
		this._textParsed.defaults = this._style

		let currentStyle = chars[0].style
		let currentFont = SdfText._fonts.get(currentStyle.fontName) || SdfText._fonts.get("default")
		if (!currentFont) {
			throw new Error(`font "${currentStyle.fontName}" not found and no default font loaded`)
		}
		let currentScale = ((currentStyle.fontSize) / currentFont.info.size) * currentStyle.fontScale * this._fontScale

		let lineWidth = 0
		let lineHeight = 0
		let lineBase = 0
		let xOffset = 0
		let yOffset = 0
		let lastSymbol = 0
		let lastBreakPos = 0
		let boxWidth = 0
		let currentLine = SdfText.getLine()

		for (let i = 0; i < chars.length; i += 1) {
			const char = chars[i]

			if (currentStyle != char.style) {
				currentStyle = char.style
				const nextFont = SdfText._fonts.get(currentStyle.fontName)
				if (nextFont) {
					currentFont = nextFont
				}
				currentScale = ((currentStyle.fontSize) / currentFont.info.size) * currentStyle.fontScale * this._fontScale
			}

			if (char.symbol == Ascii.SPACE) {
				currentLine.width = lineWidth
				currentLine.height = lineHeight
				currentLine.baseLine = lineBase
				currentLine.spaces += 1
				lastBreakPos = i
			}

			if (char.symbol == Ascii.NEW_LINE) {
				currentLine.width = lineWidth
				currentLine.height = lineHeight
				currentLine.baseLine = lineBase
				currentLine.align = currentStyle.align
				currentLine.yOffset = yOffset
				boxWidth = Math.max(lineWidth, boxWidth)
				xOffset = 0
				yOffset += currentLine.height + currentStyle.lineSpacing * currentScale
				lines.push(currentLine)
				lastSymbol = Ascii.NEW_LINE
				lastBreakPos = -1
				lineWidth = 0
				lineHeight = currentFont.common.lineHeight * currentScale
				lineBase = currentFont.common.base * currentScale
				currentLine = SdfText.getLine()
				char.charData = null
				continue
			}

			const charData = currentFont.charMap.get(char.symbol)

			if (!charData) {
				char.charData = null
				continue
			}

			if (lastSymbol) {
				xOffset += currentStyle.letterSpacing * currentScale
				if (lastSymbol && charData.kerning) {
					xOffset += (charData.kerning.get(lastSymbol) || 0) * currentScale
				}
			}

			lastSymbol = char.symbol

			char.line = currentLine
			char.font = currentFont
			char.charData = charData
			char.scale = currentScale
			char.xOffset = xOffset + charData.xoffset * currentScale

			lineWidth = char.xOffset + charData.width * currentScale
			lineHeight = Math.max(currentFont.common.lineHeight * currentScale, lineHeight)
			lineBase = Math.max(currentFont.common.base * currentScale, lineBase)

			xOffset += charData.xadvance * currentScale

			if (lastBreakPos >= 0 && this._wordWrapWidth > 0 && lineWidth > this._wordWrapWidth) {
				i = lastBreakPos
				chars[i].charData = null
				currentLine.spaces -= 1
				currentLine.align = currentStyle.align
				currentLine.yOffset = yOffset
				currentLine.wrapped = true
				xOffset = 0
				yOffset += currentLine.height + currentStyle.lineSpacing * currentScale
				boxWidth = Math.max(currentLine.width, boxWidth)
				lines.push(currentLine)
				lastSymbol = 0
				lastBreakPos = -1
				lineWidth = 0
				lineHeight = currentFont.common.lineHeight * currentScale
				lineBase = currentFont.common.base * currentScale
				currentLine = SdfText.getLine()
			}
		}

		lines.push(currentLine)

		const lastLine = lines[lines.length - 2]

		this._baseLineOffset = lastLine.baseLine - lastLine.height / 2
		this._lines = lines
		this._width = this._wordWrapWidth || boxWidth
		this._height = yOffset - currentStyle.lineSpacing * currentScale
	}

	private postProcessCharData() {
		const lines = this._lines!
		for (let i = 0; i < lines.length - 1; i += 1) {
			const line = lines[i]
			line.justifySpacer = 0
			line.alignOffset = 0
			if (line.align == "right") {
				line.alignOffset = this._width - line.width
			} else if (line.align == "center") {
				line.alignOffset = (this._width - line.width) / 2
			} else if (line.align == "justify" && line.wrapped) {
				line.justifySpacer = line.spaces <= 0 ? 0 : (this._width - line.width) / line.spaces
			}
		}
		const chars = this._textParsed.chars
		let currentLine!: LineRenderData
		let lineAlignOffset = 0
		for (let i = 0; i < chars.length; i += 1) {
			const char = chars[i]
			if (!char.charData) {
				char.width = 0
				continue
			}
			if (char.line != currentLine) {
				currentLine = char.line
				lineAlignOffset = currentLine.alignOffset
			}
			if (char.symbol == Ascii.SPACE) {
				lineAlignOffset += currentLine.justifySpacer
			}
			const texture = char.charData.texture
			if (texture) {
				char.textureUid = texture.baseTexture.uid
				char.tint = char.style.tint
				char.distance = char.font.distanceField.distanceRange * char.scale
				char.uvs = texture._uvs.uvsFloat32
				char.width = texture.orig.width * char.scale
				char.height = texture.orig.height * char.scale
				char.x = lineAlignOffset + char.xOffset
				char.y = currentLine.yOffset + (char.charData.yoffset * char.scale) + (currentLine.baseLine - (char.font.common.base * char.scale))
			} else {
				char.width = 0
			}
		}
	}

	private calculateVertices(renderer: Renderer) {
		if (!this._textDirty && this.transform._worldID == this._lastTransformWorldId) {
			return this._vertexDataSize
		}

		this._lastTransformWorldId = this.transform._worldID

		const chars = this._textParsed.chars
		if (chars.length == 0) {
			this._vertexDataSize = 0
			return 0
		}

		if (this._dataDirty) {
			this.generateCharRenderData()
			this._dataDirty = false
		}

		if (this._textDirty) {
			this.postProcessCharData()
			this._textDirty = false
		}

		let fVertexData = this._vertexData
		const requiredSize = chars.length * SdfTextConstants.WORDS_PER_QUAD
		if (!fVertexData || fVertexData.length < requiredSize) {
			fVertexData = new Float32Array(1 << Math.ceil(Math.log2(requiredSize) + 0.5))
			this._vertexData = fVertexData
		}
		const iVertexData = new Uint32Array(fVertexData.buffer)

		const worldTransform = this.transform.worldTransform

		const a = worldTransform.a
		const b = worldTransform.b
		const c = worldTransform.c
		const d = worldTransform.d
		const tx = worldTransform.tx
		const ty = worldTransform.ty

		const worldScale = renderer.resolution * (Math.abs(Math.sqrt((a * a) + (b * b))) + Math.abs(Math.sqrt((c * c) + (d * d)))) / 2

		let offset = 0

		for (let i = 0; i < chars.length; i += 1) {
			const char = chars[i]
			if (char.width == 0) {
				continue
			}

			const color = char.tint + (((255 * this.worldAlpha) << 24) >>> 0)
			const uvs = char.uvs
			const distance = worldScale * char.distance

			const w1 = char.x
			const w0 = w1 + char.width

			const h1 = char.y
			const h0 = h1 + char.height

			const textureUid = char.textureUid

			fVertexData[offset + 0] = (a * w1) + (c * h1) + tx
			fVertexData[offset + 1] = (d * h1) + (b * w1) + ty
			fVertexData[offset + 2] = uvs[0]
			fVertexData[offset + 3] = uvs[1]
			fVertexData[offset + 4] = distance
			fVertexData[offset + 5] = textureUid
			iVertexData[offset + 6] = color

			fVertexData[offset + 7] = (a * w0) + (c * h1) + tx
			fVertexData[offset + 8] = (d * h1) + (b * w0) + ty
			fVertexData[offset + 9] = uvs[2]
			fVertexData[offset + 10] = uvs[3]
			fVertexData[offset + 11] = distance
			fVertexData[offset + 12] = textureUid
			iVertexData[offset + 13] = color

			fVertexData[offset + 14] = (a * w0) + (c * h0) + tx
			fVertexData[offset + 15] = (d * h0) + (b * w0) + ty
			fVertexData[offset + 16] = uvs[4]
			fVertexData[offset + 17] = uvs[5]
			fVertexData[offset + 18] = distance
			fVertexData[offset + 19] = textureUid
			iVertexData[offset + 20] = color

			fVertexData[offset + 21] = (a * w1) + (c * h0) + tx
			fVertexData[offset + 22] = (d * h0) + (b * w1) + ty
			fVertexData[offset + 23] = uvs[6]
			fVertexData[offset + 24] = uvs[7]
			fVertexData[offset + 25] = distance
			fVertexData[offset + 26] = textureUid
			iVertexData[offset + 27] = color

			offset += 28
		}

		this._vertexDataSize = offset
		return offset
	}

	private destroyText() {
		this._textParsed.destroy()
		const lines = this._lines
		if (lines) {
			for (let i = 0; i < lines.length; i += 1) {
				SdfText._linePool.push(lines[i])
			}
			this._lines = null
		}
	}

	public updateTransform() {
		const worldAlpha = this.worldAlpha
		super.updateTransform()
		if (this.worldAlpha != worldAlpha) {
			this._lastTransformWorldId = -1
		}
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
		const vertexDataSize = this.calculateVertices(renderer)
		const plugin = (renderer.plugins.sdfText as SdfTextRenderer)
		if (vertexDataSize > 0) {
			this._cachedVertexData = this._vertexData!.subarray(0, vertexDataSize)
			plugin.addToBatch(this)
			if (this.flush) {
				renderer.batch.flush()
				plugin.flush()
			} else if(!this.forceBatch) {
				renderer.batch.setObjectRenderer(plugin)
			}
		} else if (this.flush && !plugin.empty) {
			renderer.batch.flush()
			plugin.flush()
		}
	}

	public destroy(options?: boolean | IDestroyOptions) {
		this.destroyText()
		super.destroy(options)
	}

	public setDirty() {
		this._textDirty = true
		this._dataDirty = true
	}

	public get fontScale() {
		return this._fontScale
	}

	public set fontScale(value: number) {
		if (this._fontScale != value) {
			this._fontScale = value
			this.setDirty()
		}
	}

	public get wordWrapWidth() {
		return this._wordWrapWidth
	}

	public set wordWrapWidth(value: number) {
		if (this._wordWrapWidth != value) {
			this._wordWrapWidth = value
			this.setDirty()
		}
	}

	public get width() {
		if (this._dataDirty) {
			this.generateCharRenderData()
			this._dataDirty = false
		}
		return this._width
	}

	public get height() {
		if (this._dataDirty) {
			this.generateCharRenderData()
			this._dataDirty = false
		}
		return this._height
	}

	public get style() {
		return this._style as Readonly<SdfTextStyle>
	}

	public setStyle(style: Partial<SdfTextStyle>) {
		this._style = {...SdfText.styleDefaults, ...style}
		this.setDirty()
	}

	public updateStyle(style: Partial<SdfTextStyle>) {
		Object.assign(this._style, style)
		this.setDirty()
	}

	public get text() {
		return this._text
	}

	public set text(value: string) {
		if (this._text != value) {
			this.destroyText()
			this._text = value
			this._textParsed = BBParser.parse(value)
			this.setDirty()
		}
	}

	public get dirty() {
		return this._textDirty
	}

	public get baseLineOffset() {
		return this._baseLineOffset
	}

	public get vertexData() {
		return this._cachedVertexData
	}

	public get textureUidMap() {
		return SdfText._fontBaseTextures
	}
}
