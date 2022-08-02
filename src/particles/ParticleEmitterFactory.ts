import { ParticleEmitter } from "./ParticleEmitter.js"
import { ParticleEmitterBehavior } from "./ParticleEmitterBehavior.js"
import { ParticleContainer } from "./ParticleContainer.js"

interface FactoryClass {
	new (config: Record<string, any>): ParticleEmitterBehavior
	type: string
}

export interface ParticleEmitterFactoryConfig {
	frequency: number
	poolSize: number
	behaviors: {
		type: string
		config: Record<string, any>
	}[]
}

export class ParticleEmitterFactory {
	private _map: Map<string, FactoryClass>

	constructor() {
		this._map = new Map()
	}

	public register(...behaviorClasses: FactoryClass[]) {
		behaviorClasses.forEach(x => this._map.set(x.type, x))
	}

	public create(container: ParticleContainer, config: ParticleEmitterFactoryConfig) {
		const emitter = new ParticleEmitter(container, config.poolSize)
		emitter.frequency = config.frequency
		config.behaviors.forEach(x => {
			const behaviorClass = this._map.get(x.type)
			if (!behaviorClass) {
				throw new Error("use of unknown behavior type " + x.type)
			}
			emitter.addBehavior(new behaviorClass(x.config))
		})
		return emitter
	}
}
