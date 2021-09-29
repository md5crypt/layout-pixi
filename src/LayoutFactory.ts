
import type { LayoutElementConfig, LayoutElementConstructorProperties } from "@md5crypt/layout"
import type { BaseElement, BaseConstructorProperties } from "./BaseElement.js"

import {
	LayoutFactory as BaseLayoutFactory,
	LayoutElementJson as BaseLayoutElementJson
} from "@md5crypt/layout"

import { ElementTypes } from "./ElementTypes.js"
import { Texture } from "@pixi/core"
import type {} from "@pixi/interaction"

type Typify<T> = {[K in keyof T]: T[K]}

export type LayoutElementJson = BaseLayoutElementJson<Typify<ElementTypes>>

export class LayoutFactory extends BaseLayoutFactory<BaseElement, LayoutElementJson> {
	private defaults?: LayoutElementConfig<any>
	private defaultsMap: Map<string, LayoutElementConfig<any>> = new Map()

	public setDefaults(defaults: LayoutElementConfig<BaseElement>): void
	public setDefaults<T extends keyof ElementTypes>(type: T, defaults: ElementTypes[T]["config"]): void
	public setDefaults(arg0: string | LayoutElementConfig<any>, arg1?: LayoutElementConfig<any>) {
		let defaults: LayoutElementConfig<any>
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

	public createElement<T extends keyof ElementTypes>(type: T, config?: ElementTypes[T]["config"]): ElementTypes[T]["element"] {
		const typeDefaults = this.defaultsMap.get(type)
		if (this.defaults || typeDefaults) {
			config = {...this.defaults, ...typeDefaults, ...config} as LayoutElementConfig
		}
		const element = super.createElement(type, config as any)
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
		return asset || Texture.EMPTY
	}

	public register<T extends keyof ElementTypes>(type: T, constructor: (props: BaseConstructorProperties<ElementTypes[T]["config"]>) => BaseElement) {
		super.register(type, constructor as any)
	}
}

export default LayoutFactory
