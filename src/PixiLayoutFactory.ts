
import type { BaseElement } from "./BaseElement"
import { LayoutConstructor, LayoutFactory } from "@md5crypt/layout"

import { ElementTypes } from "./ElementTypes"
import { Texture } from "@pixi/core"

export type PixiElementConfig = ElementTypes[keyof ElementTypes]

export class PixiLayoutFactory extends LayoutFactory<BaseElement, PixiElementConfig> {
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

	public register<T extends keyof ElementTypes>(type: T, constructor: LayoutConstructor<BaseElement, ElementTypes[T]>) {
		super.register(type, constructor as LayoutConstructor<BaseElement, PixiElementConfig>)
	}
}
