
import type { LayoutConfig } from "@md5crypt/layout"
import type { BaseElement } from "./BaseElement.js"

import {
	LayoutFactory as BaseLayoutFactory,
	LayoutElementJson as BaseLayoutElementJson
} from "@md5crypt/layout"

import { ElementTypes } from "./ElementTypes.js"
import { Texture } from "@pixi/core"
import type {} from "@pixi/interaction"

type Typify<T> = {[K in keyof T]: T[K]}

export type LayoutElementJson = BaseLayoutElementJson<Typify<ElementTypes>>

interface ElementDefaults<T extends keyof ElementTypes> {
	layout?: LayoutConfig<ElementTypes[T]["element"]>
	config?: ElementTypes[T]["config"]
}

export class LayoutFactory extends BaseLayoutFactory<BaseElement, LayoutElementJson> {
	private defaults?: ElementDefaults<any>
	private defaultsMap: Map<string, ElementDefaults<any>> = new Map()

	public setDefaults(defaults: ElementDefaults<any>): void
	public setDefaults<T extends keyof ElementTypes>(type: T, defaults: ElementDefaults<T>): void
	public setDefaults(arg0: string | ElementDefaults<any>, arg1?: ElementDefaults<any>) {
		let defaults: ElementDefaults<any>
		if (typeof arg0 == "string") {
			let object = this.defaultsMap.get(arg0)
			if (!object) {
				object = {}
				this.defaultsMap.set(arg0, object)
			}
			defaults = object
		} else {
			if (!this.defaults) {
				this.defaults = {}
			}
			defaults = this.defaults
		}
		Object.assign(defaults, arg1)
	}

	public createElement<T extends keyof ElementTypes>(type: T, name?: string, config?: ElementTypes[T]["config"]): ElementTypes[T]["element"] {
		const typeDefaults = this.defaultsMap.get(type)
		if (this.defaults || typeDefaults) {
			config = {...this.defaults?.config, ...typeDefaults?.config, ...config}
		}
		const element = super.createElement(type, name, config)
		if (this.defaults?.layout) {
			element.updateConfig(this.defaults.layout)
		}
		if (this.defaults?.layout) {
			element.updateConfig(this.defaults.layout)
		}
		return element
	}

	public onResolveAsset?: (key: string) => Texture

	public resolveAsset(asset: string | Texture | undefined | null) {
		if (typeof asset == "string") {
			if (this.onResolveAsset) {
				return this.onResolveAsset(asset)
			}
			throw new Error("string has been passed but assetResolver has not been defined")
		}
		return asset || Texture.WHITE
	}
}

export default LayoutFactory
