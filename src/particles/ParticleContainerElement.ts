import { ContainerElement } from "../ContainerElement.js"
import { BaseConstructorProperties, BaseConfig } from "../BaseElement.js"
import type LayoutFactory from "../LayoutFactory.js"

import { ParticleContainer } from "@pixi/particle-container"

export interface ParticleContainerElementConfig extends BaseConfig<ParticleContainerElement>{
	maxSize?: number
	batchSize?: number
	autoResize?: boolean
	withVertices?: boolean
	withPosition?: boolean
	withRotation?: boolean
	withUVS?: boolean
	withTint?: boolean
}

export class ParticleContainerElement extends ContainerElement {
	declare public handle: ParticleContainer

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("container-particle", props => {
			const config = props.config || {}
			return new this(props, new ParticleContainer(
				config.maxSize || 1500,
				{
					vertices: config.withVertices || false,
					position: config.withPosition || false,
					rotation: config.withRotation || false,
					uvs: config.withUVS || false,
					tint: config.withTint || false
				},
				config.batchSize || 16384,
				config.autoResize || false
			))
		})
	}

	constructor(props: BaseConstructorProperties<ParticleContainerElementConfig>, handle: ParticleContainer) {
		super(props, handle)
	}
}

export default ParticleContainerElement

declare module "../ElementTypes" {
	export interface ElementTypes {
		"container-particle": {config: ParticleContainerElementConfig, element: ParticleContainerElement}
	}
}
