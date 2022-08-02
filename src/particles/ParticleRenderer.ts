import { Renderer, ObjectRenderer, Buffer, Geometry, State } from "@pixi/core"
import { ExtensionMetadata, ExtensionType } from "@pixi/extensions"
import { TYPES, DRAW_MODES } from "@pixi/constants"
import { createIndicesForQuads, correctBlendMode } from "@pixi/utils"
import { ParticleContainer } from "./ParticleContainer.js"
import ParticleShader from "./ParticleShader.js"

const enum CONST {
	INDICES_PER_QUAD = 6,
	VERTICES_PER_QUAD = 4,
	WORDS_PER_VERTEX = 5,
	WORDS_PER_QUAD = VERTICES_PER_QUAD * WORDS_PER_VERTEX,
	STRIDE = WORDS_PER_VERTEX * 4,
	POS_VERTEX_POSITION = 0,
	POS_TEXTURE_COORD = 2,
	POS_COLOR = 4
}

class ParticleGeometry extends Geometry {
	private _size: number
	private _buffer: Buffer

	private _data: ArrayBuffer
	private _f32: Float32Array
	private _i32: Uint32Array

	constructor(size: number) {
		super()
		this._size = size
		this._data = new ArrayBuffer(4 * CONST.WORDS_PER_QUAD * size)
		this._f32 = new Float32Array(this._data)
		this._i32 = new Uint32Array(this._data)
		const indexBuffer = new Buffer(new ArrayBuffer(0), true, true)
		const buffer = new Buffer(this._data, false, false)
		indexBuffer.update(createIndicesForQuads(size))
		this.addAttribute("aVertexPosition", buffer, 2, false, TYPES.FLOAT, CONST.STRIDE, CONST.POS_VERTEX_POSITION * 4)
			.addAttribute("aTextureCoord", buffer, 2, false, TYPES.FLOAT, CONST.STRIDE, CONST.POS_TEXTURE_COORD * 4)
			.addAttribute("aColor", buffer, 4, true, TYPES.UNSIGNED_BYTE, CONST.STRIDE, CONST.POS_COLOR * 4)
			.addIndex(indexBuffer)
		this._buffer = buffer
	}

	public update(size: number) {
		this._buffer.update(new Float32Array(this._data, 0, size * CONST.WORDS_PER_QUAD))
	}

	public get size() {
		return this._size
	}

	public set size(value: number) {
		if (this._size != value) {
			this._size = value
			this.getIndex().update(createIndicesForQuads(value))
			const data = new ArrayBuffer(4 * CONST.WORDS_PER_QUAD * value)
			this._data = data
			this._i32 = new Uint32Array(data)
			this._f32 = new Float32Array(data)
		}
	}

	public get float32DataView() {
		return this._f32
	}

	public get uint32DataView() {
		return this._i32
	}
}


export class ParticleRenderer extends ObjectRenderer {

	public static INITIAL_SIZE = 512

	public static readonly extension: ExtensionMetadata = {
		name: "particle",
		type: ExtensionType.RendererPlugin
	}

	private _shader!: ParticleShader
	private _geometry: ParticleGeometry

	private _state: State

	constructor(renderer: Renderer) {
		super(renderer)
		this._geometry = new ParticleGeometry(ParticleRenderer.INITIAL_SIZE)
		this._state = State.for2d()
		renderer.runners.contextChange.add(this)
	}

	public contextChange() {
		if (!this._shader) {
			this._shader = new ParticleShader()
		}
	}

	public render(container: ParticleContainer) {
		const requiredSize = container.count

		if (this._geometry.size < requiredSize) {
			this._geometry.size = Math.pow(2, Math.round(Math.log2(requiredSize)) + 1)
		}

		const i32 = this._geometry.uint32DataView
		const f32 = this._geometry.float32DataView
		const worldAlpha = container.worldAlpha
		let offset = 0

		for (const pool of container.pools) {
			const count = pool.count
			const data = pool.data
			for (let i = 0; i < count; i += 1) {
				const item = data[i]
				if (item.alpha == 0) {
					continue
				}

				const cos = Math.cos(item.angle)
				const sin = Math.sin(item.angle)

				const scale = item.scale
				const a = cos * scale
				const b = sin * scale
				const c = -sin * scale
				const d = cos * scale

				const width = item._width
				const height = item._height

				const tx = item.x + ((width / -2) * a) + ((height / -2) * c)
				const ty = item.y + ((width / -2) * b) + ((height / -2) * d)

				const uvs = item._uvs!
				const color = item.tint | (255 * worldAlpha * item.alpha) << 24

				f32[offset + 0] = tx
				f32[offset + 1] = ty
				f32[offset + 2] = uvs[0]
				f32[offset + 3] = uvs[1]
				i32[offset + 4] = color

				f32[offset + 5] = (a * width) + tx
				f32[offset + 6] = (b * width) + ty
				f32[offset + 7] = uvs[2]
				f32[offset + 8] = uvs[3]
				i32[offset + 9] = color

				f32[offset + 10] = (a * width) + (c * height) + tx
				f32[offset + 11] = (d * height) + (b * width) + ty
				f32[offset + 12] = uvs[4]
				f32[offset + 13] = uvs[5]
				i32[offset + 14] = color

				f32[offset + 15] = (c * height) + tx
				f32[offset + 16] = (d * height) + ty
				f32[offset + 17] = uvs[6]
				f32[offset + 18] = uvs[7]
				i32[offset + 19] = color

				offset += CONST.WORDS_PER_QUAD
			}
		}

		if (offset == 0) {
			// nothing to do!
			return
		}

		this._state.blendMode = correctBlendMode(container.blendMode, true)
		const quads = offset / CONST.WORDS_PER_QUAD
		this._geometry.update(quads)
		this._shader.uniforms.uSampler = container.baseTexture
		this._shader.uniforms.translationMatrix = container.transform.worldTransform.toArray(true)
		this.renderer.state.set(this._state)
		this.renderer.shader.bind(this._shader)
		this.renderer.geometry.bind(this._geometry, this._shader)
		this.renderer.geometry.draw(DRAW_MODES.TRIANGLES, CONST.INDICES_PER_QUAD * quads, 0)
	}
}
