import type { ElementTypes } from "./ElementTypes.js"
import type{ BaseConfig } from "./BaseElement.js"
import type { LayoutElementJson } from "./LayoutFactory"

type LayoutElementProps = {
	[K in keyof ElementTypes]: ElementTypes[K]["config"] & {children?: ReactNode}
}

export namespace JSX {
	export interface IntrinsicElements extends LayoutElementProps {}
	export interface ElementChildrenAttribute {
		children: {}
	}
	export interface Element {
		type: keyof ElementTypes
		config?: BaseConfig
		children?: Element[]
	}
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
	return (data.type as string) == "jsx-fragment"
}

export function toArray(data: JSX.Element) {
	return (data.type as string == "jsx-fragment" ? data.children! : [data]) as LayoutElementJson[]
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
			} else if ((item.type as string) == "jsx-fragment") {
				children.push(...item.children!)
			} else if ((item.type as string) == "jsx-slot") {
				slots[item.config!.name!] = item.children
			} else {
				children.push(item)
			}
		}
	}
	if (typeof type == "string") {
		return {
			type,
			children,
			config: props
		} as JSX.Element
	} else {
		return type({children, ...props}, slots)
	}
}

export * as default from "./JSXSupport.js"
