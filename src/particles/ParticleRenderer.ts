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

	private _batchedContainers: ParticleContainer[]


	constructor(renderer: Renderer) {
		super(renderer)
		this._geometry = new ParticleGeometry(ParticleRenderer.INITIAL_SIZE)
		this._state = State.for2d()
		renderer.runners.contextChange.add(this)
		this._batchedContainers = []
	}

	public contextChange() {
		if (!this._shader) {
			this._shader = new ParticleShader()
		}
	}

	public render(container: ParticleContainer) {
		const lt = container.localTransform
		// if we have any local transform other then translation, no batching
		// we don't want to do a full matrix multiplication for each particle
		if (lt.a != 1 || lt.b != 0 || lt.c != 0 || lt.d != 1) {
			if (this._batchedContainers.length) {
				this.flush()
			}
			this._batchedContainers.push(container)
			this.flush()
		} else {
			if (this._batchedContainers.length) {
				const firstContainer = this._batchedContainers[0]
				if (firstContainer.baseTexture != container.baseTexture || firstContainer.blendMode != container.blendMode) {
					this.flush()
				}
			}
			this._batchedContainers.push(container)
		}
	}

	private renderContainer(container: ParticleContainer, i32: Uint32Array, f32: Float32Array, offset: number) {
		const worldAlpha = container.worldAlpha
		const xContainerOffset = container.localTransform.tx - this._batchedContainers[0].localTransform.tx
		const yContainerOffset = container.localTransform.ty - this._batchedContainers[0].localTransform.ty
		for (const pool of container.pools) {
			const sortBuffer = pool.__sortBuffer
			const count = pool.count
			let rendered = 0
			// this for loop is odd
			// it iterates over "i" but checks condition on "rendered"
			// this is an optimization to not iterate over the whole sort buffer when only a part of it is used
			for (let i = 0; rendered < count; i += 1) {
				const item = sortBuffer[i]
				if (item == null) {
					continue
				}
				// clear the sort buffer entry
				// this is not done in particle pool and has to be done here
				sortBuffer[i] = null
				rendered += 1
				if (item.alpha == 0) {
					continue
				}

				const cos = Math.cos(item.angle)
				const sin = Math.sin(item.angle)

				const a = cos * item.xScale
				const b = sin * item.xScale
				const c = -sin * item.yScale
				const d = cos * item.yScale

				const width = item._width
				const height = item._height

				const xOffset = width * item.xAnchor
				const yOffset = height * item.yAnchor

				const tx = item.x - xOffset * a - yOffset * c + xContainerOffset
				const ty = item.y - xOffset * b - yOffset * d + yContainerOffset

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
		return offset
	}

	public flush() {
		const containers = this._batchedContainers
		let requiredSize = 0
		for (let i = 0; i < containers.length; i += 1) {
			requiredSize += containers[i].count
		}

		if (this._geometry.size < requiredSize) {
			this._geometry.size = Math.pow(2, Math.round(Math.log2(requiredSize)) + 1)
		}

		const i32 = this._geometry.uint32DataView
		const f32 = this._geometry.float32DataView
		let offset = 0

		for (let i = 0; i < containers.length; i += 1) {
			offset = this.renderContainer(containers[i], i32, f32, offset)
		}

		if (offset == 0) {
			// nothing to do!
			return
		}

		this._state.blendMode = correctBlendMode(containers[0].blendMode, true)
		const quads = offset / CONST.WORDS_PER_QUAD
		this._geometry.update(quads)
		this._shader.uniforms.uSampler = containers[0].baseTexture
		this._shader.uniforms.translationMatrix = containers[0].transform.worldTransform.toArray(true)
		this.renderer.state.set(this._state)
		this.renderer.shader.bind(this._shader)
		this.renderer.geometry.bind(this._geometry, this._shader)
		this.renderer.geometry.draw(DRAW_MODES.TRIANGLES, CONST.INDICES_PER_QUAD * quads, 0)
		this._batchedContainers = []
	}
}
