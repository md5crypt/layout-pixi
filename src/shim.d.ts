
declare module "@pixi/graphics" {
	export { Graphics } from "pixi.js"
}

declare module "@pixi/display" {
	export { Container } from "pixi.js"
}

declare module "@pixi/math" {
	export { Rectangle } from "pixi.js"
}

declare module "@pixi/core" {
	export { Texture } from "pixi.js"
}

declare module "@pixi/sprite" {
	export { Sprite } from "pixi.js"
}

declare module "@pixi/interaction" {
	export { InteractionManager } from "pixi.js"
}

declare module "@pixi/text" {
	export type TextStyleAlign = "left" | "center" | "right" | "justify"
	export type TextStyleFill = string | string[] | number | number[] | CanvasGradient | CanvasPattern
	export type TextStyleFontStyle = "normal" | "italic" | "oblique"
	export type TextStyleFontVariant = "normal" | "small-caps"
	export type TextStyleFontWeight = "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
	export type TextStyleLineJoin = "miter" | "round" | "bevel"
	export type TextStyleTextBaseline = "alphabetic" | "top" | "hanging" | "middle" | "ideographic" | "bottom"
	export type TextStyleWhiteSpace = "normal" | "pre" | "pre-line"

	export interface ITextStyle {
		align: TextStyleAlign
		breakWords: boolean
		dropShadow: boolean
		dropShadowAlpha: number
		dropShadowAngle: number
		dropShadowBlur: number
		dropShadowColor: string | number
		dropShadowDistance: number
		fill: TextStyleFill
		fillGradientType: number
		fillGradientStops: number[]
		fontFamily: string | string[]
		fontSize: number | string
		fontStyle: TextStyleFontStyle
		fontVariant: TextStyleFontVariant
		fontWeight: TextStyleFontWeight
		letterSpacing: number
		lineHeight: number
		lineJoin: TextStyleLineJoin
		miterLimit: number
		padding: number
		stroke: string | number
		strokeThickness: number
		textBaseline: TextStyleTextBaseline
		trim: boolean
		whiteSpace: TextStyleWhiteSpace
		wordWrap: boolean
		wordWrapWidth: number
		leading: number
	}

	export { Text, TextStyle, TextMetrics } from "pixi.js"
}
