import { BaseElement, BaseConfig, BaseConstructorProperties } from "./BaseElement.js"
import LayoutFactory from "./LayoutFactory.js"
import { SdfTextFlushBarrier } from "./sdfText/index.js"

export class SdfTextFlushBarrierElement extends BaseElement {
	declare public readonly handle: SdfTextFlushBarrier

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("text-sdf-barrier", props => new this(props, new SdfTextFlushBarrier()))
	}

	protected constructor(props: BaseConstructorProperties<BaseConfig<any>>, handle: SdfTextFlushBarrier) {
		super(props, handle)
	}
}

export default SdfTextFlushBarrierElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"text-sdf-barrier": {config: BaseConfig, element: SdfTextFlushBarrierElement}
	}
}
