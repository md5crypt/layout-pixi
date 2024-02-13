import { ContainerElement, ContainerElementConfig } from "./ContainerElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"

import { Container3d } from "./projection/proj3d/Container3d.js"

export interface Container3dElementConfig extends ContainerElementConfig<"container-3d", Container3dElement> {
}

export class Container3dElement extends ContainerElement<Container3d> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("container-3d", config => new this(factory, config, new Container3d()))
	}

	public get zScale() {
		return this.handle.transform.scale.z
	}

	public set zScale(value: number) {
		this.handle.transform.scale.z = value
	}

	public get zPosition() {
		return this.handle.transform.position.z
	}

	public set zPosition(value: number) {
		this.handle.transform.position.z = value
	}

	public get zPivot() {
		return this.handle.transform.pivot.z
	}

	public set zPivot(value: number) {
		this.handle.transform.pivot.z = value
	}

	public get euler() {
		return this.handle.transform.euler
	}
}

export default Container3dElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"container-3d": Container3dElementConfig
	}
}
