import { Sprite } from "@pixi/sprite"
import { Renderer, Texture } from "@pixi/core"
import { Transform3d } from "./Transform3d.js"

export class Sprite3d extends Sprite {
	declare transform: Transform3d
	private _culledByFrustrum: boolean

	public frontTexture: Texture
	public backTexture: Texture | null

	constructor(texture: Texture) {
		super(texture)
		this.transform = new Transform3d()
		this.vertexData = new Float32Array(12)
		this._culledByFrustrum = false
		this.frontTexture = texture
		this.backTexture = null
	}

	private updateTexture() {
		let texture
		if (this.backTexture) {
			texture = this.transform.worldTransform3d.isFrontFace() ? this.frontTexture : this.backTexture
		} else {
			texture = this.frontTexture
		}
		if (!texture) {
			texture = Texture.EMPTY
		}
		if (texture != this._texture) {
			this._textureID = -1
			this._textureTrimmedID = -1
			this._texture = texture
		}
		return texture
	}

	isFrontFace(forceUpdate = false): boolean {
		if (forceUpdate) {
			this._recursivePostUpdateTransform()
			this.displayObjectUpdateTransform()
		}
		return this.transform.worldTransform3d.isFrontFace()
	}

	getDepth(forceUpdate = false) {
		if (forceUpdate) {
			this._recursivePostUpdateTransform()
			this.displayObjectUpdateTransform()
		}
		return this.transform.worldTransform3d.getDepth()
	}

	calculateVertices() {
		const texture = this.updateTexture()

		// @ts-expect-error
		if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
			return
		}

		// update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
		if (this._textureID !== texture._updateID) {
			this.uvs = texture._uvs.uvsFloat32
		}

		// @ts-expect-error
		this._transformID = this.transform._worldID
		this._textureID = texture._updateID

		const wt = this.transform.worldTransform3d.mat4
		const vertexData = this.vertexData
		const trim = texture.trim
		const orig = texture.orig
		const anchor = this._anchor

		let w0: number
		let w1: number
		let h0: number
		let h1: number

		if (trim) {
			w1 = trim.x - (anchor._x * orig.width)
			w0 = w1 + trim.width

			h1 = trim.y - (anchor._y * orig.height)
			h0 = h1 + trim.height
		} else {
			w1 = -anchor._x * orig.width
			w0 = w1 + orig.width

			h1 = -anchor._y * orig.height
			h0 = h1 + orig.height
		}

		let culled = false

		let z

		vertexData[0] = (wt[0] * w1) + (wt[4] * h1) + wt[12]
		vertexData[1] = (wt[1] * w1) + (wt[5] * h1) + wt[13]
		z = (wt[2] * w1) + (wt[6] * h1) + wt[14]
		vertexData[2] = (wt[3] * w1) + (wt[7] * h1) + wt[15]
		culled = culled || z < 0

		vertexData[3] = (wt[0] * w0) + (wt[4] * h1) + wt[12]
		vertexData[4] = (wt[1] * w0) + (wt[5] * h1) + wt[13]
		z = (wt[2] * w0) + (wt[6] * h1) + wt[14]
		vertexData[5] = (wt[3] * w0) + (wt[7] * h1) + wt[15]
		culled = culled || z < 0

		vertexData[6] = (wt[0] * w0) + (wt[4] * h0) + wt[12]
		vertexData[7] = (wt[1] * w0) + (wt[5] * h0) + wt[13]
		z = (wt[2] * w0) + (wt[6] * h0) + wt[14]
		vertexData[8] = (wt[3] * w0) + (wt[7] * h0) + wt[15]
		culled = culled || z < 0

		vertexData[9] = (wt[0] * w1) + (wt[4] * h0) + wt[12]
		vertexData[10] = (wt[1] * w1) + (wt[5] * h0) + wt[13]
		z = (wt[2] * w1) + (wt[6] * h0) + wt[14]
		vertexData[11] = (wt[3] * w1) + (wt[7] * h0) + wt[15]
		culled = culled || z < 0

		this._culledByFrustrum = culled
	}

	public calculateBounds() {
		// no-op
	}

	public containsPoint() {
		return false
	}

	_render(renderer: Renderer) {
		this.calculateVertices()

		if (this._culledByFrustrum) {
			return
		}

		renderer.batch.setObjectRenderer(renderer.plugins.batch2d)
		renderer.plugins.batch2d.render(this)
	}

	get euler() {
		return this.transform.euler
	}

	get position() {
		return this.transform.position
	}

	get scale() {
		return this.transform.scale
	}

	get pivot() {
		return this.transform.pivot
	}

	set texture(value: Texture) {
		this.frontTexture = value
	}

	get texture() {
		return this.frontTexture
	}
}
