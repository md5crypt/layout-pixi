import { Renderer, ObjectRenderer, Buffer, BaseTexture, Texture, Geometry, State } from "@pixi/core"
import { TYPES, DRAW_MODES, BLEND_MODES } from "@pixi/constants"
import { createIndicesForQuads } from "@pixi/utils"

import SdfTextShader from "./SdfTextShader.js"

export interface SdfTextRenderObject {
	get vertexData(): Float32Array
	get textureUidMap(): ReadonlyMap<number, BaseTexture>
}

export const enum SdfTextConstants {
	INDICES_PER_QUAD = 6,
	VERTICES_PER_QUAD = 4,
	WORDS_PER_VERTEX = 7,
	WORDS_PER_QUAD = VERTICES_PER_QUAD * WORDS_PER_VERTEX,
	STRIDE = WORDS_PER_VERTEX * 4,
	POS_VERTEX_POSITION = 0,
	POS_TEXTURE_COORD = 2,
	POS_F_WIDTH = 4,
	POS_TEXTURE_ID = 5,
	POS_COLOR = 6
}

class SdfTextGeometry extends Geometry {
	constructor() {
		super()
		const indexBuffer = new Buffer(new ArrayBuffer(0), true, true)
		indexBuffer.update(createIndicesForQuads(256 * 256))
		const buffer = new Buffer(new Float32Array(SdfTextConstants.WORDS_PER_QUAD), false, false)
		this.addAttribute("aVertexPosition", buffer, 2, false, TYPES.FLOAT, SdfTextConstants.STRIDE, SdfTextConstants.POS_VERTEX_POSITION * 4)
			.addAttribute("aTextureCoord", buffer, 2, false, TYPES.FLOAT, SdfTextConstants.STRIDE, SdfTextConstants.POS_TEXTURE_COORD * 4)
			.addAttribute("aFWidth", buffer, 1, false, TYPES.FLOAT, SdfTextConstants.STRIDE, SdfTextConstants.POS_F_WIDTH * 4)
			.addAttribute("aTextureId", buffer, 1, false, TYPES.FLOAT, SdfTextConstants.STRIDE, SdfTextConstants.POS_TEXTURE_ID * 4)
			.addAttribute("aColor", buffer, 4, true, TYPES.UNSIGNED_BYTE, SdfTextConstants.STRIDE, SdfTextConstants.POS_COLOR * 4)
			.addIndex(indexBuffer)
	}
}

export class SdfTextRenderer extends ObjectRenderer {
	private _shader!: SdfTextShader
	private _geometry: SdfTextGeometry

	private _batch: SdfTextRenderObject[]
	private _batchSize: number
	private _vertexData: Float32Array
	private _maxTextures!: number

	private _baseTextureList: BaseTexture[]
	private _baseTextureMap: Map<BaseTexture, number>
	private _textureIndexMap: Map<number, number>

	private _inputOffset: number

	private _state: State

	public static MAX_TEXTURES = 32
	public static FORCE_BATCH = false

	constructor(renderer: Renderer) {
		super(renderer)
		this._baseTextureList = []
		this._baseTextureMap = new Map()
		this._textureIndexMap = new Map()
		this._batch = []
		this._batchSize = 0
		this._inputOffset = 0
		this._geometry = new SdfTextGeometry()
		this._vertexData = new Float32Array(0)
		this._state = State.for2d()
		this._state.blendMode = BLEND_MODES.NORMAL_NPM
		renderer.runners.contextChange.add(this)
	}

	public contextChange() {
		const gl = this.renderer.gl
		this._maxTextures = Math.min(
			gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
			SdfTextRenderer.MAX_TEXTURES
		)
		this._shader = new SdfTextShader(this._maxTextures)
	}

	public addToBatch(renderObject: SdfTextRenderObject) {
		this._batch.push(renderObject)
		this._batchSize += renderObject.vertexData.length
	}

	public get empty() {
		return this._batch.length == 0
	}

	private renderBatch(size: number) {
		for (let i = 0; i < this._baseTextureList.length; i += 1) {
			this.renderer.texture.bind(this._baseTextureList[i], i)
		}
		this._geometry.getBuffer("aVertexPosition").update(this._vertexData.subarray(0, size))
		this.renderer.geometry.bind(this._geometry, this._shader)
		this.renderer.geometry.draw(DRAW_MODES.TRIANGLES, SdfTextConstants.INDICES_PER_QUAD * (size / SdfTextConstants.WORDS_PER_QUAD), 0)
		this._baseTextureList = []
		this._baseTextureMap.clear()
	}

	private processObject(renderObject: SdfTextRenderObject, offset: number) {
		const output = this._vertexData
		const vertexData = this._inputOffset ? renderObject.vertexData.subarray(this._inputOffset) : renderObject.vertexData
		const size = vertexData.length
		output.set(vertexData, offset)

		let lastTextureUid = -1
		let lastTextureId = -1

		const textureUidMap = renderObject.textureUidMap
		const textureIndexMap = this._textureIndexMap
		textureIndexMap.clear()

		for (let i = SdfTextConstants.POS_TEXTURE_ID; i < size; i += SdfTextConstants.WORDS_PER_VERTEX) {
			const textureUid = output[offset + i]
			if (textureUid == lastTextureUid) {
				output[offset + i] = lastTextureId
			} else {
				let textureId = textureIndexMap.get(textureUid)
				if (textureId === undefined) {
					const baseTexture = textureUidMap.get(textureUid)!
					textureId = this._baseTextureMap.get(baseTexture)
					if (textureId === undefined) {
						if (this._baseTextureList.length == this._maxTextures) {
							this.renderBatch(offset + i - SdfTextConstants.POS_TEXTURE_ID)
							this._inputOffset += i - SdfTextConstants.POS_TEXTURE_ID
							return 0
						} else {
							textureId = this._baseTextureList.length
							this._baseTextureList.push(baseTexture)
							this._baseTextureMap.set(baseTexture, textureId)
						}
					}
					textureIndexMap.set(textureUid, textureId)
				}
				output[offset + i] = textureId
				lastTextureId = textureId
				lastTextureUid = textureUid
			}
		}

		this._inputOffset = 0
		return vertexData.length
	}

	public flush() {
		if (this._batch.length == 0) {
			return
		}
		for (let i = 0; i < this._baseTextureList.length; i += 1) {
			this.renderer.texture.bind(this._baseTextureList[i], i)
		}
		this._baseTextureList = []
		this._baseTextureMap.clear()
		this.renderer.shader.bind(this._shader)
		this.renderer.state.set(this._state)
		let vertexData: Float32Array

		vertexData = this._vertexData
		if (vertexData.length < this._batchSize) {
			vertexData = new Float32Array(1 << Math.ceil(Math.log2(this._batchSize) + 0.5))
			this._vertexData = vertexData
		}

		let offset = 0
		for (let i = 0; i < this._batch.length; i += 1) {
			const delta = this.processObject(this._batch[i], offset)
			if (delta == 0) {
				offset = 0
				i -= 1
			} else {
				offset += delta
			}
		}

		if (offset) {
			this.renderBatch(offset)
		}

		this._batch = []
		this._batchSize = 0
	}
}

export default SdfTextRenderer
