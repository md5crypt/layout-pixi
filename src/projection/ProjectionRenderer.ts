import { BatchRenderer, BatchShaderGenerator, Renderer, ViewableBuffer, Buffer, ExtensionMetadata, ExtensionType, IBatchableElement, Geometry } from "@pixi/core"
import { TYPES } from "@pixi/constants"
import { premultiplyTint } from "@pixi/utils"

const shaderVert =
`precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
	gl_Position.xyw = projectionMatrix * translationMatrix * aVertexPosition;
	gl_Position.z = 0.0;

	vTextureCoord = aTextureCoord;
	vTextureId = aTextureId;
	vColor = aColor * tint;
}`

const shaderFrag =
`varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
	vec4 color;
	%forloop%
	gl_FragColor = color * vColor;
}`

class Batch3dGeometry extends Geometry {
	// @internal
	public _buffer: Buffer
	// @internal
	public _indexBuffer: Buffer

	constructor(isStatic = false) {
		super()
		const buffer = new Buffer(undefined, isStatic, false)
		const indexBuffer = new Buffer(undefined, isStatic, true)
		this.addAttribute("aVertexPosition", buffer, 3, false, TYPES.FLOAT)
			.addAttribute("aTextureCoord", buffer, 2, false, TYPES.FLOAT)
			.addAttribute("aColor", buffer, 4, true, TYPES.UNSIGNED_BYTE)
			.addAttribute("aTextureId", buffer, 1, true, TYPES.FLOAT)
			.addIndex(indexBuffer)
		this._buffer = buffer
		this._indexBuffer = indexBuffer
	}
}
export class ProjectionRenderer extends BatchRenderer {
	public static readonly extension: ExtensionMetadata = {
		name: "batch2d",
		type: ExtensionType.RendererPlugin
	}

	constructor(renderer: Renderer) {
		super(renderer)
		this.shaderGenerator = new BatchShaderGenerator(shaderVert, shaderFrag)
		this.geometryClass = Batch3dGeometry
		this.vertexSize = 7
	}

	packInterleavedGeometry(element: IBatchableElement, attributeBuffer: ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number) {
		const uint32View = attributeBuffer.uint32View
		const float32View = attributeBuffer.float32View
		const packedVertices = aIndex / this.vertexSize
		const uvs = element.uvs
		const indices = element.indices
		const vertexData = element.vertexData
		const textureId = element._texture.baseTexture._batchLocation

		const alpha = Math.min(element.worldAlpha, 1.0)
		const argb = (alpha < 1.0 && element._texture.baseTexture.alphaMode)
			? premultiplyTint(element._tintRGB, alpha)
			: element._tintRGB + (alpha * 255 << 24)

		let j = 0
		for (let i = 0; i < vertexData.length; i += 3) {
			float32View[aIndex++] = vertexData[i]
			float32View[aIndex++] = vertexData[i + 1]
			float32View[aIndex++] = vertexData[i + 2]
			float32View[aIndex++] = uvs[j]
			float32View[aIndex++] = uvs[j + 1]
			uint32View[aIndex++] = argb
			float32View[aIndex++] = textureId
			j += 2
		}

		for (let i = 0; i < indices.length; i++) {
			indexBuffer[iIndex++] = packedVertices + indices[i]
		}
	}
}
