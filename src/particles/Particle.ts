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
	public scale = 1
	public alpha = 1
	public data = {} as Record<string, any>

	public set texture(texture: Texture) {
		this._uvs = texture._uvs.uvsFloat32
		this._width = texture.width
		this._height = texture.height
	}
}
