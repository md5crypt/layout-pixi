import { Renderer, Texture, BaseTexture } from "@pixi/core"
import { DisplayObject } from "@pixi/display"
import { BLEND_MODES } from "@pixi/constants"
import { ParticlePool } from "./ParticlePool.js"
import { ParticleRenderer } from "./ParticleRenderer.js"

export class ParticleContainer extends DisplayObject {
	public sortDirty: boolean

	public baseTexture: BaseTexture
	public blendMode: BLEND_MODES

	private _pools: Set<ParticlePool>

	constructor() {
		super()
		this.sortDirty = false
		this.baseTexture = Texture.EMPTY.baseTexture
		this.blendMode = BLEND_MODES.NORMAL
		this._pools = new Set()
	}

	public addPool(pool: ParticlePool) {
		this._pools.add(pool)
	}

	public removePool(pool: ParticlePool) {
		this._pools.delete(pool)
	}

	public calculateBounds() {
		// no-op
	}

	public removeChild(child: DisplayObject) {
		// no-op
	}

	public render(renderer: Renderer) {
		if (!this.visible || this.worldAlpha <= 0 || !this.renderable || this.count == 0) {
			return
		}
		const plugin = renderer.plugins.particle as ParticleRenderer
		renderer.batch.setObjectRenderer(plugin)
		plugin.render(this)
	}

	public get pools() {
		return this._pools.values()
	}

	public get count() {
		let sum = 0
		for (const pool of this._pools) {
			sum += pool.count
		}
		return sum
	}
}
