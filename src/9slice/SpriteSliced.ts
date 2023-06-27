import { Sprite } from "@pixi/sprite"
import { TextureMatrix } from "@pixi/core"
import { IPointData, Point } from "@pixi/math"

export class SpriteSliced extends Sprite {
	private static _slicedIndices = new Uint16Array([
		0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 3, 7, 6,
		4, 5, 8, 5, 9, 8, 5, 6, 9, 6, 10, 9, 6, 7, 10, 7, 11, 10,
		8, 9, 12, 9, 13, 12, 9, 10, 13, 10, 14, 13, 10, 11, 14, 11, 15, 14
	])
	private static _normalIndices = new Uint16Array([0, 1, 2, 0, 2, 3])
	private static _point = new Point(0, 0)

	private _isSliced = false

	private _leftWidth = 0
	private _rightWidth = 0
	private _topHeight = 0
	private _bottomHeight = 0

	private get minScale() {
		const width = this._width
		const height = this._height
		const sliceWidth = this._leftWidth + this._rightWidth
		const scaleW = width > sliceWidth ? 1 : width / sliceWidth
		const sliceHeight = this._topHeight + this._bottomHeight
		const scaleH = height > sliceHeight ? 1 : height / sliceHeight
		const scale = Math.min(scaleW, scaleH)
		return scale
	}

	public calculateVertices() {
		if (!this._isSliced) {
			super.calculateVertices()
			return
		}
		const texture = this._texture

		// @ts-expect-error
		if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
			return
		}

		// @ts-expect-error
		this._transformID = this.transform._worldID
		this._textureID = texture._updateID

		const width = this._width
		const height = this._height

		const origWidth = texture.orig.width
		const origHeight = texture.orig.height

		const trim = texture.trim || {x: 0, y: 0, width: origWidth, height: origHeight}

		const trimTop = trim.y
		const trimBottom = origHeight - trim.height - trim.y

		const top = trimTop / origHeight
		const bottom = trimBottom / origHeight

		const topHeight = Math.max(this._topHeight - trimTop, 0)
		const bottomHeight = Math.max(this._bottomHeight - trimBottom, 0)

		const trimLeft = trim.x
		const trimRight = origWidth - trim.width - trim.x

		const left = trimLeft / origWidth
		const right = trimRight / origWidth

		const leftWidth = Math.max(this._leftWidth - trimLeft, 0)
		const rightWidth = Math.max(this._rightWidth - trimRight, 0)

		const vertices = this.vertexData
		const scale = this.minScale

		if (leftWidth > 0) {
			vertices[0] = vertices[8] = vertices[16] = vertices[24] = trimLeft
			vertices[2] = vertices[10] = vertices[18] = vertices[26] = trimLeft + leftWidth * scale
		} else {
			vertices[0] = vertices[8] = vertices[16] = vertices[24] = vertices[2] = vertices[10] = vertices[18] = vertices[26] = width * left
		}

		if (rightWidth > 0) {
			vertices[4] = vertices[12] = vertices[20] = vertices[28] = width - trimRight - rightWidth * scale
			vertices[6] = vertices[14] = vertices[22] = vertices[30] = width - trimRight
		} else {
			vertices[4] = vertices[12] = vertices[20] = vertices[28] = vertices[6] = vertices[14] = vertices[22] = vertices[30] = width * (1 - right)
		}

		if (topHeight > 0) {
			vertices[1] = vertices[3] = vertices[5] = vertices[7] = trimTop
			vertices[9] = vertices[11] = vertices[13] = vertices[15] = trimTop + topHeight * scale
		} else {
			vertices[1] = vertices[3] = vertices[5] = vertices[7] = vertices[9] = vertices[11] = vertices[13] = vertices[15] = height * top
		}

		if (bottomHeight > 0) {
			vertices[17] = vertices[19] = vertices[21] = vertices[23] = height - trimBottom - bottomHeight * scale
			vertices[25] = vertices[27] = vertices[29] = vertices[31] = height - trimBottom
		} else {
			vertices[17] = vertices[19] = vertices[21] = vertices[23] = vertices[25] = vertices[27] = vertices[29] = vertices[31] = height * (1 - bottom)
		}

		const wt = this.transform.worldTransform

		const a = wt.a
		const b = wt.b
		const c = wt.c
		const d = wt.d
		const tx = wt.tx
		const ty = wt.ty

		const xOffset = this.anchor._x * this._width
		const yOffset = this.anchor._y * this._height

		for (let i = 0; i < 32; i += 2) {
			const x = vertices[i + 0] - xOffset
			const y = vertices[i + 1] - yOffset
			vertices[i + 0] = (a * x) + (c * y) + tx
			vertices[i + 1] = (b * x) + (d * y) + ty
		}

		// @ts-expect-error
		if (this._roundPixels) {
			for (let i = 0; i < 32; i += 1) {
				vertices[i] = Math.round(vertices[i])
			}
		}

		const uvs = this.uvs

		uvs[0] = uvs[8] = uvs[16] = uvs[24] = left
		uvs[1] = uvs[3] = uvs[5] = uvs[7] = top
		uvs[6] = uvs[14] = uvs[22] = uvs[30] = (1 - right)
		uvs[25] = uvs[27] = uvs[29] = uvs[31] = (1 - bottom)

		uvs[2] = uvs[10] = uvs[18] = uvs[26] = left + (leftWidth / origWidth)
		uvs[4] = uvs[12] = uvs[20] = uvs[28] = (1 - right) - (rightWidth / origWidth)
		uvs[9] = uvs[11] = uvs[13] = uvs[15] = top + (topHeight / origHeight)
		uvs[17] = uvs[19] = uvs[21] = uvs[23] = (1 - bottom) - (bottomHeight / origHeight)

		let textureMatrix = texture.uvMatrix
		if (!textureMatrix) {
			textureMatrix = new TextureMatrix(texture)
			texture.uvMatrix = textureMatrix
		}
		textureMatrix.update()
		textureMatrix.multiplyUvs(uvs)
	}

	protected _calculateBounds() {
		if (!this._isSliced) {
			super._calculateBounds()
			return
		}

		// @ts-expect-error
		let vertexData = this.vertexTrimmedData

		// @ts-expect-error
		if (this._transformTrimmedID !== this.transform._worldID) {
			if (!vertexData) {
				vertexData = new Float32Array(8)
				// @ts-expect-error
				this.vertexTrimmedData = vertexData
			}

			// @ts-expect-error
			this._transformTrimmedID = this.transform._worldID

			const wt = this.transform.worldTransform
			const a = wt.a
			const b = wt.b
			const c = wt.c
			const d = wt.d
			const tx = wt.tx
			const ty = wt.ty

			const anchor = this._anchor
			const w1 = -anchor._x * this._width
			const w0 = w1 + this.width
			const h1 = -anchor._y * this._height
			const h0 = h1 + this._height

			vertexData[0] = (a * w1) + (c * h1) + tx
			vertexData[1] = (d * h1) + (b * w1) + ty
			vertexData[2] = (a * w0) + (c * h1) + tx
			vertexData[3] = (d * h1) + (b * w0) + ty
			vertexData[4] = (a * w0) + (c * h0) + tx
			vertexData[5] = (d * h0) + (b * w0) + ty
			vertexData[6] = (a * w1) + (c * h0) + tx
			vertexData[7] = (d * h0) + (b * w1) + ty
		}
		this._bounds.addQuad(vertexData)
	}

	public containsPoint(point: IPointData) {
		const tempPoint = SpriteSliced._point
		this.worldTransform.applyInverse(point, tempPoint)
		let width: number
		let height: number
		if (this._isSliced) {
			width = this._width
			height = this._height
		} else {
			width = this._texture.orig.width
			height = this._texture.orig.height
		}
		const x1 = -width * this.anchor.x
		if (tempPoint.x >= x1 && tempPoint.x < x1 + width) {
			const y1 = -height * this.anchor.y
			if (tempPoint.y >= y1 && tempPoint.y < y1 + height) {
				return true
			}
		}
		return false
	}

	public setSliced(regions: number[]) {
		this._leftWidth = regions[0]
		this._topHeight = regions[1]
		this._rightWidth = regions[2]
		this._bottomHeight = regions[3]
		this.isSliced = true
		// @ts-expect-error
		this._transformID = -1
		return this
	}

	public get isSliced() {
		return this._isSliced
	}

	public set isSliced(value: boolean) {
		if (this._isSliced != value) {
			this._isSliced = value
			if (value) {
				this.indices = SpriteSliced._slicedIndices
				this.uvs = new Float32Array(32)
				this.vertexData = new Float32Array(32)
			} else {
				this.indices = SpriteSliced._normalIndices
				this.vertexData = new Float32Array(8)
				this._textureID = -1
			}
			// @ts-expect-error
			this._transformID = -1
			// @ts-expect-error
			this._transformTrimmedID = -1
		}
	}

	public get leftWidth() {
		return this._leftWidth
	}

	public set leftWidth(value: number) {
		if (this._leftWidth != value) {
			this._leftWidth = value
			// @ts-expect-error
			this._transformID = -1
		}
	}

	public get rightWidth() {
		return this._rightWidth
	}

	public set rightWidth(value: number) {
		if (this._rightWidth != value) {
			this._rightWidth = value
			// @ts-expect-error
			this._transformID = -1
		}
	}

	public get topHeight() {
		return this._topHeight
	}

	public set topHeight(value: number) {
		if (this._topHeight != value) {
			this._topHeight = value
			// @ts-expect-error
			this._transformID = -1
		}
	}

	public get bottomHeight() {
		return this._bottomHeight
	}

	public set bottomHeight(value: number) {
		if (this._bottomHeight != value) {
			this._bottomHeight = value
			// @ts-expect-error
			this._transformID = -1
		}
	}

	get width() {
		return this._width
	}

	set width(value: number) {
		if (this._width != value) {
			this._width = value
			if (this._isSliced) {
				// @ts-expect-error
				this._transformID = -1
				// @ts-expect-error
				this._transformTrimmedID = -1
			}
		}
	}

	get height() {
		return this._height
	}

	set height(value: number) {
		if (this._height != value) {
			this._height = value
			if (this._isSliced) {
				// @ts-expect-error
				this._transformID = -1
				// @ts-expect-error
				this._transformTrimmedID = -1
			}
		}
	}
}
