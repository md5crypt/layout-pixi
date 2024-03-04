import { ParticlePool } from "./ParticlePool"
import { ParticleEmitter } from "./ParticleEmitter"

export class ParticleEmitterBehavior {
	private _emitter!: ParticleEmitter

	/* @internal */
	public _order!: number

	/* @internal */
	public _initOrder!: number

	public get order() {
		return 0
	}

	public get initOrder() {
		return this.order
	}

	protected onEmitterAssign() {
	}

	public init(pool: ParticlePool, amount: number) {
	}

	public update(pool: ParticlePool, deltaMs: number) {
	}

	public get emitter() {
		return this._emitter
	}

	/* @internal */
	public set emitter(value: ParticleEmitter) {
		this._emitter = value
		this.onEmitterAssign()
	}
}
