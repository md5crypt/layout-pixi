import { ParticlePool } from "./ParticlePool.js"
import { ParticleContainer } from "./ParticleContainer.js"
import { ParticleEmitterBehavior } from "./ParticleEmitterBehavior.js"

export class ParticleEmitter {
	private _behaviors: Map<typeof ParticleEmitterBehavior, ParticleEmitterBehavior>
	private _initBehaviorList: ParticleEmitterBehavior[]
	private _updateBehaviorList: ParticleEmitterBehavior[]
	private _pool: ParticlePool
	private _container: ParticleContainer
	private _reminder: number
	private _emitTimer: number

	public waveSize: number
	public emitDuration: number

	public frequency: number

	public constructor(container: ParticleContainer, poolSize: number) {
		this._container = container
		this._pool = new ParticlePool(poolSize)
		this._container.addPool(this._pool)
		this._behaviors = new Map()
		this._initBehaviorList = []
		this._updateBehaviorList = []
		this._reminder = 0
		this._emitTimer = Infinity
		this.waveSize = Infinity
		this.emitDuration = -1
		this.frequency = 0
	}

	public addBehaviors(...behaviors: ParticleEmitterBehavior[]) {
		behaviors.forEach(x => this.addBehavior(x))
	}

	public addBehavior(behavior: ParticleEmitterBehavior) {
		behavior.emitter = this
		this._behaviors.set(behavior.constructor as any, behavior)
		if (behavior.init != ParticleEmitterBehavior.prototype.init) {
			this._initBehaviorList.push(behavior)
			this._initBehaviorList.sort((a, b) => a.initOrder - b.initOrder)
		}
		if (behavior.update != ParticleEmitterBehavior.prototype.update) {
			this._updateBehaviorList.push(behavior)
			this._updateBehaviorList.sort((a, b) => a.initOrder - b.initOrder)
		}
	}

	public getBehavior<T extends ParticleEmitterBehavior>(behaviorClass: {new(...args: any): T}) {
		const behavior = this._behaviors.get(behaviorClass)
		if (!behavior) {
			throw new Error(`behavior of class ${behaviorClass.name} not found`)
		}
		return behavior as T
	}

	public startEmitter(duration?: number) {
		const value = duration === undefined ? this.emitDuration : duration
		this._emitTimer = value >= 0 ? value : Infinity
		this._reminder = 0
	}

	public stopEmitter() {
		this._emitTimer = 0
	}

	public emit(waveSize?: number) {
		const spawnCount = Math.min(this._pool.capacity - this._pool.count, waveSize === undefined ? this.waveSize : waveSize)
		if (spawnCount > 0) {
			const offset = this._pool.count
			const created = this._pool.createMany(spawnCount)
			for (let i = 0; i < this._initBehaviorList.length; i += 1) {
				this._pool.seek(offset)
				this._initBehaviorList[i].init(this._pool, created)
			}
		}
	}

	public update(deltaMs: number) {
		if (this._pool.count > 0) {
			for (let i = 0; i < this._updateBehaviorList.length; i += 1) {
				this._pool.seek(0)
				this._updateBehaviorList[i].update(this._pool, deltaMs)
			}
		}
		if (this._emitTimer > 0 && this.frequency > 0) {
			const value = this._reminder + deltaMs
			const amount = Math.floor(value / this.frequency)
			this._reminder = value - (this.frequency * amount)
			if (amount > 0) {
				this.emit(amount)
			}
			this._emitTimer -= deltaMs
		}
	}

	public destroy() {
		this._container.removePool(this._pool)
	}

	public get emitting() {
		return this._emitTimer > 0
	}

	public get container() {
		return this._container
	}

	public get pool() {
		return this._pool
	}
}
