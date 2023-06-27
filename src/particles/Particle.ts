import { Texture } from "@pixi/core"

export class Particle {
	/* @internal */
	public _uvs = null as Float32Array | null
	/* @internal */
	public _width = 0
	/* @internal */
	public _height = 0
	/* @internal */
	public _order = 0

	public x = 0
	public y = 0
	public angle = 0
	public tint = 0xFFFFFF
	public xScale = 1
	public yScale = 1
	public xAnchor = 0.5
	public yAnchor = 0.5
	public alpha = 1
	public data = {} as Record<string, any>

	public copyFrom(src: Particle) {
		this.x = src.x
		this.y = src.y
		this.angle = src.angle
		this.tint = src.tint
		this.xScale = src.xScale
		this.yScale = src.yScale
		this.xAnchor = src.xAnchor
		this.yAnchor = src.yAnchor
		this.alpha = src.alpha
		this._uvs = src._uvs
		this._width = src._width
		this._height = src._height
	}

	public set texture(texture: Texture) {
		this._uvs = texture._uvs.uvsFloat32
		this._width = texture.width
		this._height = texture.height
	}

	public set scale(value: number) {
		this.xScale = value
		this.yScale = value
	}

	public get scale() {
		return this.xScale
	}
}
