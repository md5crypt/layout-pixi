export * from "./LayoutFactory.js"
export * from "./BaseElement.js"
export * from "./ContainerElement.js"
export * from "./GraphicElement.js"
export * from "./RootElement.js"
export * from "./SpriteElement.js"
export * from "./SlicedSpriteElement.js"
export * from "./TiledSpriteElement.js"
export * from "./TextElement.js"

import LayoutFactory from "./LayoutFactory.js"
import ContainerElement from "./ContainerElement.js"
import GraphicElement from "./GraphicElement.js"
import SpriteElement from "./SpriteElement.js"
import SlicedSpriteElement from "./SlicedSpriteElement.js"
import TiledSpriteElement from "./TiledSpriteElement.js"
import TextElement from "./TextElement.js"

export const layoutFactory = new LayoutFactory()

ContainerElement.register(layoutFactory)
GraphicElement.register(layoutFactory)
SpriteElement.register(layoutFactory)
SlicedSpriteElement.register(layoutFactory)
TiledSpriteElement.register(layoutFactory)
TextElement.register(layoutFactory)
