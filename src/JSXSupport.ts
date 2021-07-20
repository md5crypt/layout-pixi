import { LayoutConfig } from "@md5crypt/layout"
import { ElementTypes } from "./ElementTypes"
import { BaseConfig } from "./BaseElement"

type LayoutElementProps = {
	[K in keyof ElementTypes]:
	LayoutConfig<ElementTypes[K]["element"]> &
	ElementTypes[K]["config"] &
	{name?: string, metadata?: Record<string, any>} &
	{children?: React.ReactNode}
}

declare global {
	namespace JSX {
		interface IntrinsicElements extends LayoutElementProps {}
		interface ElementChildrenAttribute {
			children: {}
		}
		interface Element {
			type: keyof ElementTypes
			layout?: LayoutConfig<any>
			config?: BaseConfig
			metadata?: Record<string, any>
			children?: Element[]
		}
	}
}

const baseConfigKeys = [
	"top",
	"left",
	"width",
	"height",
	"padding",
	"margin",
	"flexMode",
	"flexHorizontalAlign",
	"flexVerticalAlign",
	"flexGrow",
	"ignoreLayout",
	"enabled",
	"volatile"
] as const

const baseConfigKeySet: Exclude<keyof LayoutConfig<any>, typeof baseConfigKeys[number]> extends never ?
	Set<string> : "baseConfigKeys is missing keys" = new Set(baseConfigKeys)

export namespace React {
	export interface ReactNodeArray extends Array<ReactNode> {}
	export type ReactNode = JSX.Element | ReactNodeArray | false | null | undefined

	export type ComponentFunction = ((props: any) => JSX.Element)
	export type IntrinsicElementNames = keyof LayoutElementProps

	export type ComponentProps<T extends IntrinsicElementNames | ComponentFunction> =
		T extends keyof LayoutElementProps ?
			LayoutElementProps[T] :
			T extends (arg0: infer K) => any ? Omit<K, "children"> : never

	export function Fragment(props: {children?: ReactNode}) {
		return {type: "jsx-fragment" as any, children: props.children || []} as JSX.Element
	}

	export function isFragment(data: JSX.Element) {
		return (data.type as string) == "jsx-fragment"
	}

	export function toArray(data: JSX.Element) {
		return data.type as string == "jsx-fragment" ? data.children! : [data]
	}

	export function createElement<T extends IntrinsicElementNames | ComponentFunction>(type: T, props: ComponentProps<T>, ...rawChildren: ReactNode[]) {
		const children = []
		for (let i = 0; i < rawChildren.length; i += 1) {
			const value = rawChildren[i]
			if (value) {
				if (Array.isArray(value)) {
					for (let j = 0; j < value.length; j += 1) {
						const item = value[j]
						if (item) {
							children.push(item)
						}
					}
				} else if ((value.type as string) == "jsx-fragment") {
					children.push(...value.children!)
				} else {
					children.push(value)
				}
			}
		}
		if (typeof type == "string") {
			const result = {
				type,
				children,
				layout: {},
				config: {}
			} as Record<string, any>
			if (props) {
				for (const key in props) {
					if (key == "name") {
						result.name = props[key]
					} else if (key == "metadata") {
						result.metadata = props[key]
					} else if (baseConfigKeySet.has(key)) {
						result.layout[key] = props[key]
					} else {
						result.config[key] = props[key]
					}

				}
			}
			return result as JSX.Element
		} else {
			return type({children, ...props})
		}
	}
}

export default React
