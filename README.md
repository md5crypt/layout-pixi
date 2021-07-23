# PIXI layout engine

This package builds on top of [@md5crypt/layout](https://github.com/md5crypt/layout) to provide a layout engine for PIXI.js. Reading that package's docs is recommended before starting doing anything with this one.

# Layout elements

The following layout elements are available:

| type | class | description |
|:---|:---:|:---|
| container | `ContainerElement` | container for other elements |
| graphic | `GraphicElement` | allows drawing shapes with `PIXI.Graphics` |
| sprite | `SpriteElement` | for displaying textures | 
| sprite-sliced | `SlicedSpriteElement` | a 9-slice mesh element | 
| sprite-tiling | `TiledSpriteElement` | allows drawing repeated backgrounds | 
| text | `TextElement` | renders text using `PIXI.Text` |
| - | `RootElement` | meant to be used as the layout root element |

## BaseElement

```typescript
abstract class BaseElement extends LayoutElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| mask | `boolean` | `false` | when set to true a PIXI mask is used to clip the element's content to it's size. |
| sorted | `boolean` | `false` | enables z-index sorting of children for this container. Note that z-index sorting works only for **direct children** |
| zIndex | `number` | 0 | z-index value of the element, only meangfull if parent has z-index sorting enabled |
| alpha | `number` | 1 | opacity of the element |
| rotation | `number` | 0 | rotation around the center of the element, value in degrees |
| flipped | `false` `"vertical"` `"horizontal"` | `false` | should the element be mirrored vertically / horizontally |
| interactive | `boolean` | `false` | enables interaction events on the underling PIXI object |
| noPropagation | `boolean` | `false` | sets interactiveChildren to false on the underling PIXI object disabling interaction event propagation |
| anchor | `number` `[number, number]` | 0 | sets the anchor point (0.5 being the center) used for element positioning. If a single number is provided it is used for both axis. **This not the same as PIXI's anchor property** its used **only for positioning**, the pivot point used for rotation and scaling is set always to the element's center.

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.DisplayObject` | **(readonly)** a reference to the underlying PIXI object that this element is using. |
| sorted | `boolean` | see `sorted` in configuration |
| zIndex | `number` | see `zIndex` in configuration |
| alpha | `number` | see `alpha` in configuration |
| rotation | `number` | see `rotation` in configuration |
| flipped | `false` `"vertical"` `"horizontal"` | see `flipped` in configuration |
| interactive | `boolean` | see `interactive` in configuration |
| noPropagation | `boolean` | see `noPropagation` in configuration |
| mask | `boolean` | see `mask` in configuration |
| anchor | `[number, number]` | see `anchor` in configuration |
| scale | `number` | **(readonly)** the scale of the current element |
| globalScale | `number` | **(readonly)** the global scale of the current element (relative to the layout's root element) |
| globalBoundingBox | `{top: number, left: number, width: number, height: number}` | **(readonly)** the global position of the object (relative to the layout's root element) |

### Function reference

| name | signature | description |
|:---|:---:|:---|
| setAnchor | `(x: number, y?: number) => void` | an alternative way to set the `anchor` property |
| on | `(event: string, callback: Function) => void` | passthrough to the underlying PIXI object's `on` function.

## ContainerElement (container)

```typescript
class ContainerElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| scale | `boolean` | 1 | The element's scale. The scale does not change the element's dimensions, it's applied **after the layout has been computed**.

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.Container` | **(readonly)** reference to the underlying PIXI object.
| scale | `boolean` | see `scale` in configuration |


## GraphicElement (graphic)

```typescript
class GraphicElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| onDraw | `(self: GraphicElement) => void` | `undefined` | A callback called every time the objects needs to be redrawn. Clear is called automatically before calling onDraw.

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.GraphicElement` | **(readonly)** reference to the underlying PIXI object.
| onDraw | `(self: GraphicElement) => void` | see `onDraw` in configuration |

## SpriteElement (sprite)

```typescript
class SpriteElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| image | `string` `PIXI.Texture` `null` | `null` | Texture the element should use, see the LayoutFactory documentation below to see how string value are resolved. When null `Texture.WHITE` is used. |
| scaling | `ScalingType` | `"none"` | controls how the texture is scaled to fit the layout element. See ScalingType description in the section below. |
| verticalAlign | `"top"` `"middle"` `"bottom"` | `"top"` | controls how the texture should be positioned inside the container. |
| horizontalAlign | `"left"` `"center"` `"right"` | `"left"` | controls how the texture should be positioned inside the container. |
| tint | `number` | `0xFFFFFF` | tint applied to the texture |

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.Sprite` | **(readonly)** reference to the underlying PIXI object.
| image | `string` `PIXI.Texture` `null` | see `image` in configuration |
| scaling | `ScalingType` | see `scaling` in configuration |
| verticalAlign | `"top"` `"middle"` `"bottom"` | see `verticalAlign` in configuration |
| horizontalAlign | `"left"` `"center"` `"right"` | see `horizontalAlign` in configuration |
| tint | `number` | see `tint` in configuration |

### Texture scaling modes

| mode | description |
|:---:|:---|
| none | texture is positioned inside the element based on `verticalAlign` and `horizontalAlign` and no additional transformations are applied |
| clipped | same as `none` but the texture is cropped to the element size after positioning. The same can be achieved using `mask = true` but the scaling mode is more efficient as it does not interrupt batch rendering with masks. |
| stretch | stretch the texture to fit the element, `verticalAlign` and `horizontalAlign` are ignored |
| contain | scale the image maintaining aspect ratio in such a way that the entire image is visible. `verticalAlign` and `horizontalAlign` are used to position the texture. |
| cover | scale and crop the image maintaining the aspect ratio in such a way that the entire element is filled. `verticalAlign` and `horizontalAlign` are used to position the texture before cropping. |


## SlicedSpriteElement (sprite-sliced)

```typescript
class SlicedSpriteElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| image | `string` `PIXI.Texture` `null` | `null` | Texture the element should use, see the LayoutFactory documentation below to see how string value are resolved. When null `Texture.WHITE` is used. |
| tint | `number` | `0xFFFFFF` | tint applied to the texture |
| slices | `PositioningBox` | 0 | the slicing regions, uses PositioningBox from `@md5crypt/layout`. |

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.NineSlicePlane` | **(readonly)** reference to the underlying PIXI object.
| image | `string` `PIXI.Texture` `null` | see `image` in configuration |
| tint | `number` | see `tint` in configuration |

### Function reference

| name | signature | description |
|:---|:---:|:---|
| setSlices | `(slices: PositioningBox) => void` | allows updating the slicing regions |

## TiledSpriteElement (sprite-tiled)

```typescript
class TiledSpriteElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| image | `string` `PIXI.Texture` `null` | `null` | Texture the element should use, see the LayoutFactory documentation below to see how string value are resolved. When null `Texture.WHITE` is used. |
| tint | `number` | `0xFFFFFF` | tint applied to the texture |

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.TilingSprite` | **(readonly)** reference to the underlying PIXI object.
| image | `string` `PIXI.Texture` `null` | see `image` in configuration |
| tint | `number` | see `tint` in configuration |

## TextElement (text)

```typescript
class TextElement extends BaseElement
```

### Configuration reference

| filed | type | default | description |
|:---|:---:|:---:|:---|
| text | `string` | `""` | Text to render. |
| fit | `boolean` | `true` | Should the text be shrank to fit the element. See text fitting section below for more details. |
| verticalAlign | `"top"` `"bottom"` `"middle"` | `"top"` | controls how the text is positioned inside the element. For horizontal control set text align in text style. |
| style | `PIXI.ITextStyle` | `{}` | The text style to use for the text. |
| resolution | `number` | 1 | the resolution the text should be rendered at. The actual text resolution is computed based on the element's global scale, this value multiplies that value allowing for oversampling. |
| roundPixels | `boolean` | `false` | sets `roundPixels` in the underlying PIXI object. In theory this can improve text readability. |

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.Text` | **(readonly)** reference to the underlying PIXI object.
| text | `string` | see `text` in configuration |
| fit | `boolean` | see `fit` in configuration |
| verticalAlign | `"top"` `"bottom"` `"middle"` | see `verticalAlign` in configuration |
| resolution | `number` | see `resolution` in configuration |
| roundPixels | `boolean` | see `roundPixels` in configuration |

### Function reference

| name | signature | description |
|:---|:---:|:---|
| setStyle | `(style: Partial<ITextStyle>) => void` | sets the text style. |
| updateStyle | `(style: Partial<ITextStyle>) => void` | updates the current style by merging it with the provided object. |
| setText | `setText(text: string, style?: Partial<ITextStyle>) => void` | A convenience function that allows setting the text and style at the same time. |

### Text fitting

If text fitting is enabled the text font size will be automatically decreased to fit the element size. **Text fitting will never increase the configured font size** it will only decrease it.

Text fitting operates in two modes:

- If word wrap is disabled, a single iteration is made to compute the target font size, as no re-flow is needed.
- If word wrap is enabled, a binary search is executed to find the target font size. The search is capped at 8 iterations.

## RootElement (root)

```typescript
class RootElement extends BaseElement
```

The RootElement class is meant to be used as the layout root. **It can not be crated via the factory** and is meant to be crated by its constructor.

RootElement has a pre-configured layout config of `volatile = true`, a hardcoded name `@root` and type equal to `root`.

Note that RootElement **does not have to be used as the root element**. For example a `ContainerElement` will do just as well.

### Properties reference

| filed | type | description |
|:---|:---:|:---|
| handle | `PIXI.Container` | **(readonly)** reference to the underlying PIXI object.
| scale | `boolean` | sets the base scale for the entire layout |

### Function reference
| name | signature | description |
|:---|:---:|:---|
| constructor | `(factory: LayoutFactory, config?: BaseConfig) => RootElement` | the intended way of creating a RootElement instance |

# Layout factory

The layout factory shipped with this package extends the LayoutFactory from `@md5crypt/layout` with a few additional features.

## Default values

Default config / layout values can be set for created elements. The defaults can be set for all elements or for specific element types individually. This can be done by calling `setDefaults` on a factory instance.

## Texture resolver

Layout elements using textures allow them to be reference via string names. These string names will be resolved using the factories `resolveAsset` function, which by default will fail with an exception.

To use this feature a `onResolveAsset` callback must be set that accepts string names and returns texture instances.

## Properties reference

| filed | type | description |
|:---|:---:|:---|
| onResolveAsset | `(key: string) => Texture` | the texture resolver callback used by `resolveAsset`

## Function reference

| name | signature | description |
|:---|:---:|:---|
| setDefaults | `(defaults: ElementDefaults): void` | sets default values for all created elements. |
| setDefaults | `(type: string, defaults: ElementDefaults): void` | sets default values for created elements of a given type. |

# Using the module

There are two ways to use this library. The simplest one is to just import `layoutFactory` from `@md5crypt/layout-pixi`. This will create a default `LayoutFactory` instance with all the element types registered.

For some applications this can be unwanted as it will bloat the output code with all the element implementations and their underlying PIXI objects.

To avoid this, the individual elements can be imported one by one and registered to a custom factory instance. For example, if all we need is the container and sprite elements, we can do the following:

```typescript
import ContainerElement from "@md5crypt/layout-pixi/ContainerElement"
import SpriteElement from "@md5crypt/layout-pixi/SpriteElement"
import LayoutFactory from "@md5crypt/layout-pixi/LayoutFactory"

const layoutFactory = new LayoutFactory()

ContainerElement.register(layoutFactory)
SpriteElement.register(layoutFactory)
```

# Using JSX for writing layouts

JSX bindings are provided as an alternative way for writing the layout configurations.

To use the provided JSX bindings where intended to be used with typescript (`tsconfig.json` should have `jsx` set to `react`).

To use the bindings simply cerate a `.tsx` file and add the following import:

```typescript
import React from "@md5crypt/layout-pixi/JSXSupport"
```



`JSX.Element` is assignable to `LayoutElementJSON` and can be passed directly to the layout factory.

One gotcha to watch out for is a top level `React.Fragment` which will result with a element of type `jsx-fragment` that the factory will refuse to create. To solve this `React.toArray` can be used. For more details about this function see the reference section below.

## Basic syntax

The tag names are mapped to element types, so `<container/>` will be compiled into `{type: "container"}`.

All keys from `layout` and `config` objects are merged into a single property namespace, together with `name` and `metadata`.

So `<sprite name="hello" width={100} image="foo" />` will be compiled into

```json
{
    "type": "sprite",
    "name": "hello",
    "layout": {
        "width": 100
    },
    "config": {
        "image": "foo"
    }
}
```

This (obviously) means that `config` and `layout` keys can not overlap.

## Components

Stateless function components are supported, see example below:

```tsx
const Foo = (props: {name: string, children?: React.ReactNode}) => (
    <container name={props.name}>
        {props.children}
    </container>
)

<Foo name="bar">
    <sprite image="foo-bar" />
</Foo>
```

This will be compiled to:

```json
{
    "type": "container",
    "name": "bar",
    "children": [
        {
            "type": "sprite",
            "config": {
                "image": "foo-bar"
            }
        }
    ]
}
```

## Slots

As a bonus basic slot support was added, see example below:

```tsx
const Foo = (props: {children?: React.ReactNode}, slots: React.Slots<"bar">) => (
    <container name={props.name}>
        {slots.bar}
        <container>
            {props.children}
        </container>
    </container>
)

<Foo>
    <React.Slot name="bar">
        <sprite image="rab-oof" />
    </React.Slot>
    <sprite image="foo-bar" />
</Foo>
```

This will be compiled to:

```json
{
    "type": "container",
    "children": [
        {
            "type": "container",
            "children": [
                {
                    "type": "sprite",
                    "config": {
                        "image": "rab-oof"
                    }
                }
            ]
        },
        {
            "type": "sprite",
            "config": {
                "image": "foo-bar"
            }
        }
    ]
}
```

## Function reference

| name | signature | description |
|:---|:---:|:---|
| `React.Fragment` | `(props: {children?: ReactNode}) => JSX.Element` | The build-in `Fragment` component |
| `React.Slot` | `(props: {name: string, children?: ReactNode}) => JSX.Element` | The build-in `Slot` Component |
| `React.isFragment` | `(element: JSX.Element) => boolean` | returns true if the passed element is a top-level fragment element |
| `React.toArray` | `(element: JSX.Element)` => `JSX.Element[]` | for a top-level fragment will return its children. For other elements will return the same element by wrapped in an array. This function is needed to unpack a top-level `React.Fragment` as layout factory will refuse to render it. |
| `React.createElement` | `(type, props, ...children) => JSX.Element` | the internal function JSX gets compiled into |

## Type reference

| name | description |
|:---:|:---|
| `React.ReactNode` | Type to use for JSX children |
| `React.Slots<T>` | Type to use for the slot parameter, `T` should be a union of literal strings that will be used as keys. |
| `React.ComponentProps<T>` | Gets the type of properties of the given component. Works for intrinsic elements (like `"sprite"`) as well as for user defined function components. |

# Implementing new elements

New element types can be easily added outside the module's code. Let's use the following example implementation of an simple `AnimatedSpriteElement` to explain the process.

```typescript

import {
    // our new element will extend BaseElement so it needs to be imported
    BaseElement,

    // the new element's config will extend BaseElement config
    BaseConfig,

    // this is the type of BaseElement's constructor parameter
    BaseConstructorProperties
} from "@md5crypt/layout-pixi/BaseElement"

// we need that type for the register function
import type LayoutFactory from "@md5crypt/layout-pixi/LayoutFactory"

// PIXI stuff that will be needed
import { Texture } from "@pixi/core"
import { AnimatedSprite } from "@pixi/sprite-animated"

// Here we define the element's config properties that will be available in LayoutElementJSON
export interface AnimatedSpriteElementConfig extends BaseConfig {
    images?: (Texture | string)[]
    playing?: boolean
}

export class AnimatedSpriteElement extends BaseElement {
    // we must override handle type to match the PIXI object that this element will use
    declare public handle: AnimatedSprite

    // the static register function that is used to add the element to the layout factory
    public static register(layoutFactory: LayoutFactory) {
        layoutFactory.register("sprite-animated", (factory, name, config) => new this({
            factory,
            name,
            config,
            type: "sprite-animated",
            // the PIXI object instance this element will be using
            handle: new AnimatedSprite([])
        }))
    }

    constructor(props: BaseConstructorProperties<AnimatedSpriteElementConfig>) {
        super(props)
    
        // BaseElement expects all PIXI object's to anchored at the center
        this.handle.anchor.set(0.5, 0.5)
        const config = props.config

        // apply config (if provided)
        if (config) {
            if (config.images) {
                this.images = config.images
            }
            if (config.playing) {
                this.handle.play()
            }
        }
    }

    public set images(value: (Texture | null | string)[]) {
        // here we resolve the string names to Textures using factory.resolveAsset
        this.handle.textures = value.map(x => this.factory.resolveAsset(x))

        // changing the texture can change the element dimensions so we must notify
        // the underlying LayoutElement that its layout must be recalculated
        this.setDirty()
    }

    public get playing() {
        return this.handle.playing
    }

    public set playing(value: boolean) {
        if (value) {
            this.handle.play()
        } else {
            this.handle.stop()
        }
    }

    // this is called every time the layout has changed
    protected onUpdate() {        
        super.onUpdate()

        // we must set the PIXI object's position
        // in most cases the computedLeft / computedTop helper properties from BaseElement can be used
        this.handle.position.set(this.computedLeft, this.computedTop)

        // no fancy scaling options, just stretch the sprite to size
        this.handle.width = this.innerWidth
        this.handle.height = this.innerHeight
    }

    // we must override contentHeight and contentWidth to let the layout know what size
    // is this element's content (in this case the texture dimensions)

    public get contentHeight() {
        return (this.handle.textures[0] as Texture).height
    }

    public get contentWidth() {
        return (this.handle.textures[0] as Texture).width
    }
}

export default AnimatedSpriteElement

// we must inject the new element to the type system by adding
// it to a special interface declared inside the layout-pixi package
declare module "@md5crypt/layout-pixi/ElementTypes" {
    export interface ElementTypes {
        "sprite-animated": {
            config: AnimatedSpriteElementConfig,
            element: AnimatedSpriteElement
        }
    }
}
```

Remember that the created `AnimatedSpriteElement` class must be registered in a LayoutFactory instance using `AnimatedSpriteElement.register`.

If the element type was correctly injected into `ElementTypes` LayoutElementJSON and JSX elements should automatically recognize the new element type.
