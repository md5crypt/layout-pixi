import { LayoutElement, LayoutFactory, LayoutElementJson as BaseLayoutElementJson, Typify } from "@md5crypt/layout"
import { ElementTypes } from "./ElementTypes"
import { Container } from "@pixi/display"
import { Graphics } from "@pixi/graphics"
import type { } from "@pixi/interaction"

export type LayoutElementJson = BaseLayoutElementJson<Typify<ElementTypes>>
export const layoutFactory = new LayoutFactory<BaseElement, LayoutElementJson>()

export interface BaseConfig {
	mask?: boolean
	sorted?: boolean
	zIndex?: number
	alpha?: number
	rotation?: number
	flipped?: false | "vertical" | "horizontal"
	interactive?: boolean
}

export abstract class BaseElement extends LayoutElement<BaseElement> {
	public readonly handle: Container
	private hidden: boolean
	private mask?: boolean

	protected constructor(handle: Container, name?: string, config?: BaseConfig) {
		super(name)
		this.handle = handle
		this.hidden = false
		if (config) {
			this.mask = config.mask
			this.handle.zIndex = config.zIndex || 0
			config.sorted && (this.handle.sortableChildren = true)
			config.interactive && (this.interactive = true)
			config.alpha !== undefined && (this.alpha = config.alpha)
			config.rotation && (this.rotation = config.rotation)
			config.flipped && (this.flipped = config.flipped)
		}
	}

	public set alpha(value: number) {
		this.hidden = value === 0
		this.handle.visible = value !== 0
		this.handle.alpha = value
	}

	public set rotation(value: number) {
		this.handle.angle = value
	}

	public set flipped(value: false | "vertical" | "horizontal") {
		if (value == "vertical") {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = -Math.abs(this.handle.scale.x)
		} else if (value == "horizontal") {
			this.handle.scale.x = -Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		} else {
			this.handle.scale.x = Math.abs(this.handle.scale.x)
			this.handle.scale.y = Math.abs(this.handle.scale.y)
		}
	}

	public set interactive(value: boolean) {
		this.handle.interactive = value
	}

	public set interactiveChildren(value: boolean) {
		this.handle.interactiveChildren = value
	}

	public get contentHeight() {
		return this.handle.width
	}

	public get contentWidth() {
		return this.handle.height
	}

	public on(event: string, callback: Function) {
		this.handle.on(event, callback as any)
	}

	protected onRemoveElement(index: number) {
		this.handle.removeChild(this.children[index].handle)
	}

	protected onInsertElement(element: BaseElement, index: number) {
		if ((index >= (this.children.length - 1)) || this.handle.sortableChildren) {
			this.handle.addChild(element.handle)
		} else {
			const position = this.handle.getChildIndex(this.children[index].handle)
			this.handle.addChildAt(element.handle, position)
		}
	}

	protected onUpdate() {
		this.handle.visible = this.enabled && !this.hidden
		if (this.mask) {
			const graphics = new Graphics()
			graphics.beginFill(0xFFFFFF)
			graphics.drawRect(
				this.config.padding.left,
				this.config.padding.top,
				this.innerWidth,
				this.innerHeight
			)
			graphics.endFill()
			if (this.handle.mask) {
				this.handle.removeChild(this.handle.mask as any)
			}
			this.handle.addChild(graphics)
			this.handle.mask = graphics
		}
	}
}
