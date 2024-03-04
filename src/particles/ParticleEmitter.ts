import { ParticlePool } from "./ParticlePool"
import { ParticleContainer } from "./ParticleContainer"
import { ParticleEmitterBehavior } from "./ParticleEmitterBehavior"

export class ParticleEmitter {
	private _behaviors: Map<typeof ParticleEmitterBehavior, ParticleEmitterBehavior>
	private _initBehaviorList: ParticleEmitterBehavior[]
	private _updateBehaviorList: ParticleEmitterBehavior[]
	private _pool: ParticlePool
	private _container: ParticleContainer
	private _reminder: number
	private _emitTimer: number
	private _waveCounter: number
	private _destroyed: boolean

	public waveSize: number | (() => number)
	public waveCount: number

	public emitDuration: number
	public frequency: number

	public onEmitterStart?: () => void
	public onEmitterStop?: () => void

	public constructor(container: ParticleContainer, poolSize: number) {
		this._container = container
		this._pool = new ParticlePool(poolSize)
		this._container.addPool(this._pool)
		this._behaviors = new Map()
		this._initBehaviorList = []
		this._updateBehaviorList = []
		this._reminder = 0
		this._emitTimer = 0
		this._waveCounter = 0
		this.waveSize = Infinity
		this.waveCount = 0
		this.emitDuration = -1
		this.frequency = 0
		this._destroyed = false
	}

	public addBehaviors(...behaviors: ParticleEmitterBehavior[]) {
		behaviors.forEach(x => this.addBehavior(x))
	}

	public addBehavior<T extends ParticleEmitterBehavior>(behavior: T): T
	public addBehavior<T extends ParticleEmitterBehavior>(behavior: T, order: number): T
	public addBehavior<T extends ParticleEmitterBehavior>(behavior: T, executionOrder: number, initOder: number): T
	public addBehavior<T extends ParticleEmitterBehavior>(behavior: T, executionOrder?: number, initOrder?: number) {
		behavior.emitter = this
		if (executionOrder !== undefined) {
			behavior._order = executionOrder
			behavior._initOrder = initOrder !== undefined ? initOrder : behavior.initOrder
		} else {
			behavior._order = behavior.order
			behavior._initOrder = behavior.initOrder
		}
		this._behaviors.set(behavior.constructor as any, behavior)
		if (behavior.init != ParticleEmitterBehavior.prototype.init) {
			this._initBehaviorList.push(behavior)
			this._initBehaviorList.sort((a, b) => a._initOrder - b._initOrder)
		}
		if (behavior.update != ParticleEmitterBehavior.prototype.update) {
			this._updateBehaviorList.push(behavior)
			this._updateBehaviorList.sort((a, b) => a._order - b._order)
		}
		return behavior
	}

	public getBehavior<T extends ParticleEmitterBehavior>(behaviorClass: {new(...args: any): T}) {
		const behavior = this._behaviors.get(behaviorClass)
		if (!behavior) {
			throw new Error(`behavior of class ${behaviorClass.name} not found`)
		}
		return behavior as T
	}

	public startEmitter(override?: number) {
		this.stopEmitter()
		if (this.waveCount == 0) {
			const value = override === undefined ? this.emitDuration : override
			this._emitTimer = value >= 0 ? value : Infinity
			this._reminder = 0
		} else {
			const value = override === undefined ? this.waveCount : override
			this._waveCounter = value >= 0 ? value : Infinity
			this._emitTimer = 0
		}
		if (this.onEmitterStart) {
			this.onEmitterStart()
		}
	}

	public stopEmitter() {
		if (this.emitting) {
			if (this.onEmitterStop) {
				this.onEmitterStop()
			}
			this._emitTimer = 0
			this._waveCounter = 0
		}
	}

	public emit(waveSize?: number) {
		if (waveSize === undefined) {
			waveSize = typeof this.waveSize == "number" ? this.waveSize : this.waveSize()
		}
		const spawnCount = Math.min(this._pool.capacity - this._pool.count, waveSize)
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
		if (this._waveCounter > 0) {
			this._emitTimer -= deltaMs
			if (this._emitTimer < 0) {
				this.emit()
				this._waveCounter -= 1
				if (this._waveCounter == 0) {
					this._emitTimer = 0
					if (this.onEmitterStop) {
						this.onEmitterStop()
					}
				} else {
					this._emitTimer += this.frequency
				}
			}
		} else if (this._emitTimer > 0) {
			const value = this._reminder + deltaMs
			if (this.frequency) {
				const amount = Math.floor(value / this.frequency)
				this._reminder = value - (this.frequency * amount)
				if (amount > 0) {
					this.emit(amount)
				}
			} else {
				this.emit(Infinity)
			}
			if (this._emitTimer > deltaMs ) {
				this._emitTimer -= deltaMs
			} else {
				this._emitTimer = 0
				if (this.onEmitterStop) {
					this.onEmitterStop()
				}
			}
		}
	}

	public destroy() {
		if (!this._destroyed) {
			this._container.removePool(this._pool)
			this._destroyed = true
		}
	}

	public get destroyed() {
		return this._destroyed
	}

	public get emitting() {
		return this._emitTimer > 0 || this._waveCounter > 0
	}

	public get container() {
		return this._container
	}

	public get pool() {
		return this._pool
	}
}
