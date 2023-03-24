import { SpriteElement, SpriteElementConfig } from "./SpriteElement.js"

import type LayoutFactory from "./LayoutFactory.js"

import { Sprite3d } from "./projection/proj3d/Sprite3d.js"
import { Rectangle } from "@pixi/math"

export class Sprite3dElement extends SpriteElement<Sprite3dElement> {
	declare public handle: Sprite3d

	public static register(layoutFactory: LayoutFactory) {
		layoutFactory.register("sprite-3d", props => new this(props, new Sprite3d(props.factory.resolveAsset(props.config?.image))))
	}

	public set interactive(value: boolean) {
		if (super.interactive != value) {
			super.interactive = value
			this.setDirty()
		}
	}

	public get interactive() {
		return super.interactive
	}

	protected onUpdate() {
		super.onUpdate()
		if (this.handle.interactive) {
			const width = this.width
			const height = this.height
			this.handle.hitArea = new Rectangle(-width * this.pivot[0], -height * this.pivot[1], width, height)
		}
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

export default Sprite3dElement

declare module "./ElementTypes" {
	export interface ElementTypes {
		"sprite-3d": {config: SpriteElementConfig<Sprite3dElement>, element: Sprite3dElement}
	}
}
