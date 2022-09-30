import { Texture } from "@pixi/core"

export class Particle {
	/* @internal */
	public _uvs = null as Float32Array | null
	/* @internal */
	public _width = 0
	/* @internal */
	public _height = 0

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
