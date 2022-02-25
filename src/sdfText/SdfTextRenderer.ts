import { Renderer, ObjectRenderer, Buffer, BaseTexture, Texture, Geometry, State } from "@pixi/core"
import { TYPES, DRAW_MODES, BLEND_MODES } from "@pixi/constants"
import { createIndicesForQuads } from "@pixi/utils"

import SdfTextShader from "./SdfTextShader.js"

export const enum SdfTextConstants {
	VERTICES_PER_QUAD = 4,
	WORDS_PER_VERTEX = 6,
	WORDS_PER_QUAD = VERTICES_PER_QUAD * WORDS_PER_VERTEX,
	STRIDE = WORDS_PER_VERTEX * 4,
}

class SdfTextGeometry extends Geometry {
	constructor() {
		super()
		const indexBuffer = new Buffer(new ArrayBuffer(0), true, true)
		indexBuffer.update(createIndicesForQuads(256 * 256))
		const buffer = new Buffer(new Float32Array(SdfTextConstants.WORDS_PER_QUAD), false, false)
		this.addAttribute("aVertexPosition", buffer, 2, false, TYPES.FLOAT, SdfTextConstants.STRIDE, 0 * 4)
			.addAttribute("aTextureCoord", buffer, 2, false, TYPES.FLOAT, SdfTextConstants.STRIDE, 2 * 4)
			.addAttribute("aFWidth", buffer, 1, false, TYPES.FLOAT, SdfTextConstants.STRIDE, 4 * 4)
			.addAttribute("aColor", buffer, 4, true, TYPES.UNSIGNED_BYTE, SdfTextConstants.STRIDE, 5 * 4)
			.addIndex(indexBuffer)
	}
}

export class SdfTextRenderer extends ObjectRenderer {
	private _shader: SdfTextShader
	private _geometry: SdfTextGeometry

	private _batch: Float32Array[]
	private _batchSize: number
	private _vertexData: Float32Array

	public baseTexture: BaseTexture
	public state: State

	constructor(renderer: Renderer) {
		super(renderer)
		this.baseTexture = Texture.EMPTY.baseTexture
		this._shader = new SdfTextShader()
		this._batch = []
		this._batchSize = 0
		this._geometry = new SdfTextGeometry()
		this._vertexData = new Float32Array(0)
		this.state = State.for2d()
		this.state.blendMode = BLEND_MODES.NORMAL_NPM
	}

	public addToBatch(data: Float32Array) {
		this._batch.push(data)
		this._batchSize += data.length
	}

	public get empty() {
		return this._batch.length == 0
	}

	public flush() {
		if (this._batch.length == 0) {
			return
		}
		this._shader.uniforms.uSampler = this.baseTexture
		this.renderer.shader.bind(this._shader)
		this.renderer.state.set(this.state)
		let vertexData: Float32Array
		if (this._batch.length == 1) {
			vertexData = this._batch[0]
		} else {
			vertexData = this._vertexData
			if (vertexData.length < this._batchSize) {
				vertexData = new Float32Array(1 << Math.ceil(Math.log2(this._batchSize) + 0.5))
				this._vertexData = vertexData
			}
			let offset = 0
			for (let i = 0; i < this._batch.length; i += 1) {
				const data = this._batch[i]
				vertexData.set(data, offset)
				offset += data.length
			}
			vertexData = vertexData.subarray(0, offset)
		}
		this._geometry.getBuffer("aVertexPosition").update(vertexData)
		this.renderer.geometry.bind(this._geometry, this._shader)
		this.renderer.geometry.draw(DRAW_MODES.TRIANGLES, 6 * (vertexData.length / SdfTextConstants.WORDS_PER_QUAD), 0)
		this._batch = []
		this._batchSize = 0
	}
}

export default SdfTextRenderer
