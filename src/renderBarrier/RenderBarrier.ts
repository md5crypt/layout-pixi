import { MaskData, Renderer } from "@pixi/core"
import { Container, DisplayObject } from "@pixi/display"
import { MASK_TYPES } from "@pixi/constants"


declare global {
	namespace GlobalMixins {
		interface DisplayObject {
			renderBarrierId?: number
		}
	}
}

// replace container prototype (uglyyyyyy)
Container.prototype.render = function (renderer) {
	// if the object is not visible or the alpha is 0 then no need to render this element
	if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
		return
	}
	// do a quick check to see if this element has a mask or a filter.
	if (this._mask || (this.filters && this.filters.length)) {
		// @ts-expect-error
		this.renderAdvanced(renderer)
	}
	else if (this.cullable) {
		// @ts-expect-error
		this._renderWithCulling(renderer)
	}
	else {
		// @ts-expect-error
		this._render(renderer)
		for (let i = 0, j = this.children.length; i < j; ++i) {
			const child = this.children[i]
			if (child.renderBarrierId) {
				RenderBarrier.render(child)
			} else {
				child.render(renderer)
			}
		}
	}
}

// replace container prototype (uglyyyyyy)
// @ts-expect-error
Container.prototype.renderAdvanced = function (renderer) {
	const filters = this.filters
	const mask = this._mask as MaskData
	// push filter first as we need to ensure the stencil buffer is correct for any masking
	if (filters) {
		// @ts-expect-error
		if (!this._enabledFilters) {
			// @ts-expect-error
			this._enabledFilters = []
		}
		// @ts-expect-error
		this._enabledFilters.length = 0
		for (let i = 0; i < filters.length; i++) {
			if (filters[i].enabled) {
				// @ts-expect-error
				this._enabledFilters.push(filters[i])
			}
		}
	}
	// @ts-expect-error
	const flush = (filters && this._enabledFilters && this._enabledFilters.length) ||
		(mask && (!mask.isMaskData || (mask.enabled && (mask.autoDetect || mask.type !== MASK_TYPES.NONE))))
	if (flush) {
		renderer.batch.flush()
	}
	// @ts-expect-error
	if (filters && this._enabledFilters && this._enabledFilters.length) {
		// @ts-expect-error
		renderer.filter.push(this, this._enabledFilters)
	}
	if (mask) {
		renderer.mask.push(this, this._mask)
	}
	if (this.cullable) {
		// @ts-expect-error
		this._renderWithCulling(renderer)
	}
	else {
		// @ts-expect-error
		this._render(renderer)
		for (let i = 0, j = this.children.length; i < j; ++i) {
			const child = this.children[i]
			if (child.renderBarrierId) {
				RenderBarrier.render(child)
			} else {
				child.render(renderer)
			}
		}
	}
	if (flush) {
		renderer.batch.flush()
	}
	if (mask) {
		renderer.mask.pop(this)
	}
	// @ts-expect-error
	if (filters && this._enabledFilters && this._enabledFilters.length) {
		renderer.filter.pop()
	}
}

export class RenderBarrier extends DisplayObject {
	private static barriers: Map<number, DisplayObject[]> = new Map()

	public static render(object: DisplayObject) {
		const barrierId = object.renderBarrierId!
		const list = this.barriers.get(barrierId)
		if (list) {
			list.push(object)
		} else {
			this.barriers.set(barrierId, [object])
		}
	}

	// pixi types require this
	declare sortDirty: boolean

	public barrierId: number

	constructor(barrierId = 1) {
		super()
		this.barrierId = barrierId
	}

	public calculateBounds() {
		// no-op
	}

	public removeChild(child: DisplayObject) {
		// no-op
	}

	public render(renderer: Renderer) {
		if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
			return
		}
		if (this.barrierId == -1) {
			for (const list of RenderBarrier.barriers.values()) {
				for (let i = 0; i < list.length; i += 1) {
					list[i].render(renderer)
				}
			}
			RenderBarrier.barriers.clear()
		} else {
			const list = RenderBarrier.barriers.get(this.barrierId)
			if (list) {
				for (let i = 0; i < list.length; i += 1) {
					list[i].render(renderer)
				}
				RenderBarrier.barriers.delete(this.barrierId)
			}
		}
	}
}
