import { BaseElement, BaseElementConfig } from "./BaseElement.js"
import { PixiLayoutFactory } from "./PixiLayoutFactory.js"

import { DisplayObject } from "@pixi/display"
import { Renderer } from "@pixi/core"

class PortalContainer extends DisplayObject {
	public sortDirty: boolean
	public children: DisplayObject[]
	public alphaControl: boolean

	constructor() {
		super()
		this.sortDirty = false
		this.alphaControl = false
		this.children = []
	}

	public calculateBounds() {
	}

	public updateTransform() {
		this.worldAlpha = this.alpha * this.parent.worldAlpha
	}

	public render(renderer: Renderer) {
		if (this.visible) {
			const children = this.children
			for (let i = 0; i < children.length; i += 1) {
				const child = children[i]
				if (child.visible && !child.renderable) {
					const originalAlpha = child.alpha
					if (this.alphaControl && child.worldAlpha > 0) {
						child.alpha = this.worldAlpha / child.parent.worldAlpha
						child.updateTransform()
					}
					child.renderable = true
					child.render(renderer)
					child.renderable = false
					child.alpha = originalAlpha
				}
			}
		}
	}

	public addChild(child: DisplayObject) {
		this.children.push(child)
	}

	public addChildAt(child: DisplayObject, index: number) {
		this.children.splice(index, 0, child)
	}

	public getChildIndex(child: DisplayObject) {
		return this.children.indexOf(child)
	}

	public removeChild(child: DisplayObject) {
		const index = this.children.indexOf(child)
		if (index >= 0) {
			this.children.splice(index, 1)
		}
	}

	public removeChildAt(index: number) {
		this.children.splice(index, 1)
	}
}

export interface PortalElementConfig extends BaseElementConfig<"portal", PortalElement> {
	objects: string | string[]
	alphaControl?: boolean
}

export class PortalElement extends BaseElement<PortalContainer> {
	public static register(factory: PixiLayoutFactory) {
		factory.register("portal", config => new this(factory, config))
	}

	private constructor(factory: PixiLayoutFactory, config: PortalElementConfig) {
		super(factory, config, new PortalContainer())
		this.handle.alphaControl = config.alphaControl || false
		if (config.objects) {
			this.onAttachCallback = () => {
				if (typeof config.objects == "string") {
					this.add(this.parent.getElement(config.objects))
				} else {
					config.objects.forEach(x => this.parent.getElement(x))
				}
			}
		}
	}

	public add(element: BaseElement | DisplayObject) {
		this.handle.addChild(element instanceof BaseElement ? element.handle : element)
	}

	public remove(element: BaseElement | DisplayObject) {
		this.handle.removeChild(element instanceof BaseElement ? element.handle : element)
	}

	public get alphaControl() {
		return this.handle.alphaControl
	}

	public set alphaControl(value: boolean) {
		this.handle.alphaControl = value
	}
}

declare module "./ElementTypes" {
	export interface ElementTypes {
		"portal": PortalElementConfig
	}
}
