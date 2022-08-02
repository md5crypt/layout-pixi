import { ParticlePool } from "./ParticlePool.js"
import { ParticleEmitter } from "./ParticleEmitter.js"

export class ParticleEmitterBehavior {
	private _emitter!: ParticleEmitter

	public get order() {
		return 0
	}

	public get initOrder() {
		return this.order
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
	}
}
