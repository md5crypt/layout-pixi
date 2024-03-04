import type { ElementTypes } from "./ElementTypes"
import type { BaseElementConfig } from "./BaseElement"
import type { PixiElementConfig } from "./PixiLayoutFactory"

type LayoutElementProps = {
	[K in keyof ElementTypes]: Omit<ElementTypes[K], "type" | "children"> & {children?: ReactNode}
}

export namespace JSX {
	export interface IntrinsicElements extends LayoutElementProps {}
	export interface ElementChildrenAttribute {
		children: {}
	}
	export interface Element extends BaseElementConfig {}
}

interface ReactNodeArray extends Array<ReactNode> {}
export type ReactNode = JSX.Element | ReactNodeArray | false | null | undefined

export type Slots<T extends string = string> = Record<T, ReactNode>

export type ComponentFunction = ((props: any, slots: Slots) => JSX.Element)
export type IntrinsicElementNames = keyof LayoutElementProps

export type ComponentProps<T extends IntrinsicElementNames | ComponentFunction> =
	T extends keyof LayoutElementProps ?
		LayoutElementProps[T] :
		T extends (arg0: infer K) => any ? Omit<K, "children"> : never

export function Fragment(props: {children?: ReactNode}) {
	return {type: "jsx-fragment" as any, children: props.children || []} as JSX.Element
}

export function Slot(props: {name: string, children?: ReactNode}) {
	return {type: "jsx-slot" as any, config: {name: props.name}, children: props.children || []} as JSX.Element
}

export function isFragment(data: JSX.Element) {
	return data.type == "jsx-fragment"
}

export function toArray(data: JSX.Element) {
	return (data.type == "jsx-fragment" ? data.children! : [data]) as PixiElementConfig[]
}

export function createElement<T extends IntrinsicElementNames | ComponentFunction>(type: T, props: ComponentProps<T>, ...rawChildren: ReactNode[]) {
	const children = [] as JSX.Element[]
	const slots = {} as Slots
	for (let i = 0; i < rawChildren.length; i += 1) {
		const value = rawChildren[i]
		const array = Array.isArray(value) ? value : [value]
		for (let j = 0; j < array.length; j += 1) {
			const item = array[j] as JSX.Element
			if (!item) {
				continue
			} else if (item.type == "jsx-fragment") {
				children.push(...item.children!)
			} else if (item.type == "jsx-slot") {
				slots[item.name!] = item.children
			} else {
				children.push(item)
			}
		}
	}
	if (typeof type == "string") {
		const result = props as PixiElementConfig
		result.type = type
		result.children = children as PixiElementConfig[]
		return result
	} else {
		return type({children, ...props}, slots)
	}
}

export * as default from "./JSXSupport"
