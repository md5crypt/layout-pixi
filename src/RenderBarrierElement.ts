import { BaseElement, BaseElementConfig } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { RenderBarrier } from "./renderBarrier/RenderBarrier"

export interface RenderBarrierElementConfig extends BaseElementConfig<"render-barrier", RenderBarrierElement> {
	barrierId?: number
}

export class RenderBarrierElement extends BaseElement<RenderBarrier> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("render-barrier", config => new this(factory, config))
	}

	protected constructor(factory: PixiLayoutFactory, config: RenderBarrierElementConfig) {
		super(factory, config, new RenderBarrier())
		if (config.barrierId !== undefined) {
			this.handle.barrierId = config.barrierId
		}
	}

	public set barrierId(value: number) {
		this.handle.barrierId = value
	}

	public get barreirId() {
		return this.handle.barrierId
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"render-barrier": RenderBarrierElementConfig
	}
}
