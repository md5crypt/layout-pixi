import { BaseElement, BaseElementConfig } from "./BaseElement"
import { PixiLayoutFactory } from "./PixiLayoutFactory"
import { SdfTextFlushBarrier } from "./sdfText/index"

export interface SdfTextFlushBarrierElementConfig extends BaseElementConfig<"text-sdf-barrier", SdfTextFlushBarrierElement> {
}

export class SdfTextFlushBarrierElement extends BaseElement<SdfTextFlushBarrier> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("text-sdf-barrier", config => new this(factory, config))
	}

	protected constructor(factory: PixiLayoutFactory, config: SdfTextFlushBarrierElementConfig) {
		super(factory, config, new SdfTextFlushBarrier())
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"text-sdf-barrier": SdfTextFlushBarrierElementConfig
	}
}
