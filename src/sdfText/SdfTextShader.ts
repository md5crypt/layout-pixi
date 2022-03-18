import { Shader, Program, UniformGroup } from "@pixi/core"

const shaderFrag = (maxTextures: number) => `
#define numTextures ${maxTextures}

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vFWidth;
varying float vTextureId;

uniform sampler2D uSamplers[numTextures];

void main(void) {
	vec4 texColor = vec4(0);
	int textureId = int(vTextureId);
	for (int i = 0; i < numTextures; i += 1) {
		if (i == textureId) {
			texColor = texture2D(uSamplers[i], vTextureCoord);
			break;
		}
	}
	float median = (
		texColor.r + texColor.g + texColor.b -
		min(texColor.r, min(texColor.g, texColor.b)) -
		max(texColor.r, max(texColor.g, texColor.b))
	);
	median = min(median, texColor.a);
	float screenPxDistance = vFWidth * (median - 0.5);
	float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
	gl_FragColor = vec4(vColor.b, vColor.g, vColor.r, vColor.a * alpha);
}`


const shaderVert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aFWidth;
attribute float aTextureId;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying float vFWidth;
varying float vTextureId;
varying vec4 vColor;

void main(void) {
	gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
	vTextureCoord = aTextureCoord;
	vColor = aColor;
	vFWidth = aFWidth;
	vTextureId = aTextureId;
}`


export default class SdfTextShader extends Shader {
	constructor(maxTextures: number) {
		super(new Program(shaderVert, shaderFrag(maxTextures)), {
			default: UniformGroup.from({ uSamplers: Array.from({length: maxTextures}, (_, i) => i) }, true)
		})
	}
}
