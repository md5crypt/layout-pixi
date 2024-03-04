import { Particle } from "./Particle"

export class ParticlePool {
	private _size: number
	private _data: Particle[]
	private _sortBuffer: (Particle | null)[]
	private _pivot: number

	private _index: number

	public constructor(size: number) {
		this._size = size
		this._data = Array.from({length: size}, (_, i) => {
			const particle = new Particle()
			particle._order = i
			return particle
		})
		this._sortBuffer = Array.from({length: size}, () => null)
		this._pivot = 0
		this._index = -1
	}

	public next() {
		const index = this._index + 1
		if (index < this._pivot) {
			this._index = index
			return this._data[index]
		}
		return null
	}

	public remove() {
		const index = this._index
		const pivot = this._pivot - 1
		if (index < 0 || pivot < 0) {
			return null
		}
		this._pivot = pivot
		if (index < pivot) {
			const data = this._data
			const item = data[pivot]
			data[pivot] = data[index]
			data[index] = item
			return item
		}
		return null
	}

	public create() {
		const pivot = this._pivot
		if (pivot >= this._size) {
			return null
		}
		this._pivot += 1
		return this._data[pivot]
	}

	public createMany(count = 1) {
		const pivot = this._pivot
		const capped = Math.min(this._size - pivot, Math.floor(count))
		this._pivot += capped
		return capped
	}

	public clear() {
		this._pivot = 0
		this._index = -1
	}

	public seek(value: number) {
		if (value <= 0) {
			this._index = -1
		} else if (value >= this._pivot) {
			this._index = this._pivot - 1
		} else {
			this._index = value - 1
		}
	}

	public get remaining() {
		return this._pivot - (this._index + 1)
	}

	public get count() {
		return this._pivot
	}

	public get capacity() {
		return this._size
	}

	public get data() {
		return this._data
	}

	public get offset() {
		return this._index + 1
	}

	public get empty() {
		return this._pivot == 0
	}

	/* @internal */
	public get __sortBuffer() {
		// do a insert sort pass on particles to make particle z index stable over time
		// note that this function does not clear the sort buffer before sorting
		// it relies on the caller to clean up the buffer
		// if the caller does not do that everything will crash :)
		const sortBuffer = this._sortBuffer
		const count = this._pivot
		const data = this._data
		for (let i = 0; i < count; i += 1) {
			const item = data[i]
			sortBuffer[item._order] = item
		}
		return sortBuffer
	}
}
