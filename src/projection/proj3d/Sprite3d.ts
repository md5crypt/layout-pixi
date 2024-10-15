import { Sprite } from "@pixi/sprite"
import { Renderer, Texture } from "@pixi/core"
import { Transform3d } from "./Transform3d"

export const enum BackTextureTransform {
	NONE,
	MIRROR_VERTICAL,
	MIRROR_HORIZONTAL
}

export const enum Sprite3dFaces {
	NONE = 0,
	FRONT = 1,
	BACK = 2,
	BOTH = 3
}

export class Sprite3d extends Sprite {
	declare transform: Transform3d
	private _culledByFrustrum: boolean
	private _backUvs!: Float32Array
	private _frontUvs!: Float32Array
	private _backTextureID: number

	private _frontTexture: Texture
	private _backTexture: Texture | null

	private _backTextureTransform: BackTextureTransform

	public faces: Sprite3dFaces

	constructor(texture: Texture) {
		super(texture)
		this.transform = new Transform3d()
		this.vertexData = new Float32Array(12)
		this._backTextureID = 0
		this._culledByFrustrum = false
		this._frontTexture = texture
		this._backTexture = null
		this._backTextureTransform = BackTextureTransform.NONE
		this.faces = Sprite3dFaces.BOTH
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
		const frontFace = this.transform.worldTransform3d.isFrontFace()
		const texture = (frontFace || !this._backTexture) ? this._frontTexture : this._backTexture

		if ((this.faces & (frontFace ? Sprite3dFaces.FRONT : Sprite3dFaces.BACK)) == 0) {
			this._culledByFrustrum = true
			return
		}

		if (frontFace) {
			if (this._textureID !== texture._updateID) {
				this._frontUvs = texture._uvs.uvsFloat32
				this._textureID = texture._updateID
			}
			this.uvs = this._frontUvs
		} else {
			if (this._backTextureID !== texture._updateID) {
				const org = texture._uvs.uvsFloat32
				if (this._backTextureTransform == BackTextureTransform.NONE) {
					this._backUvs = org
				} else if (this._backTextureTransform == BackTextureTransform.MIRROR_VERTICAL) {
					const uvs = new Float32Array(8)
					uvs[0] = org[2]
					uvs[1] = org[3]
					uvs[2] = org[0]
					uvs[3] = org[1]
					uvs[4] = org[6]
					uvs[5] = org[7]
					uvs[6] = org[4]
					uvs[7] = org[5]
					this._backUvs = uvs
				} else {
					const uvs = new Float32Array(8)
					uvs[0] = org[4]
					uvs[1] = org[5]
					uvs[2] = org[6]
					uvs[3] = org[7]
					uvs[4] = org[0]
					uvs[5] = org[1]
					uvs[6] = org[2]
					uvs[7] = org[3]
					this._backUvs = uvs
				}
				this._backTextureID = texture._updateID
			}
			this.uvs = this._backUvs
		}

		// @ts-expect-error
		if (this._texture === texture && this._transformID === this.transform._worldID) {
			return
		}

		this._texture = texture

		// @ts-expect-error
		this._transformID = this.transform._worldID

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
			if (!frontFace && this._backTextureTransform == BackTextureTransform.MIRROR_VERTICAL) {
				w1 = (orig.width - trim.width - trim.x) - (anchor._x * orig.width)
			} else {
				w1 = trim.x - (anchor._x * orig.width)
			}
			w0 = w1 + trim.width
			if (!frontFace && this._backTextureTransform == BackTextureTransform.MIRROR_HORIZONTAL) {
				h1 = (orig.height - trim.height - trim.y) - (anchor._y * orig.height)
			} else {
				h1 = trim.y - (anchor._y * orig.height)
			}
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
		return this._frontTexture
	}

	set frontTexture(value: Texture) {
		this._frontTexture = value
		this._textureID = -1
	}

	get frontTexture() {
		return this._frontTexture
	}

	set backTexture(value: Texture | null) {
		this._backTexture = value
		this._backTextureID = -1
	}

	get backTexture() {
		return this._backTexture
	}

	set backTextureTransform(value: BackTextureTransform) {
		this._backTextureTransform = value
		this._backTextureID = -1
	}

	get backTextureTransform() {
		return this._backTextureTransform
	}
}
