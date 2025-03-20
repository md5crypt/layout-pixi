import { Shader, Program, UniformGroup } from "@pixi/core"

const shaderFrag = (maxTextures: number) => `
#define numTextures ${maxTextures}

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vFWidth;
varying float vTextureId;
varying float vThickness;

uniform sampler2D uSamplers[numTextures];

float median(float r, float g, float b) {
	return max(min(r, g), min(max(r, g), b));
}

void main(void) {
	vec4 texColor = vec4(0);
	int textureId = int(vTextureId);
	for (int i = 0; i < numTextures; i += 1) {
		if (i == textureId) {
			texColor = texture2D(uSamplers[i], vTextureCoord);
			break;
		}
	}
	float sd = median(texColor.r, texColor.g, texColor.b);
	float screenPxDistance = vFWidth * (sd - vThickness);
	float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
	gl_FragColor = vec4(vColor.b, vColor.g, vColor.r, vColor.a * alpha);
}`


const shaderVert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aFWidth;
attribute float aTextureId;
attribute float aThickness;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying float vFWidth;
varying float vTextureId;
varying vec4 vColor;
varying float vThickness;

void main(void) {
	gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
	vTextureCoord = aTextureCoord;
	vColor = aColor;
	vFWidth = aFWidth;
	vTextureId = aTextureId;
	vThickness = aThickness;
}`


export default class SdfTextShader extends Shader {
	constructor(maxTextures: number) {
		super(new Program(shaderVert, shaderFrag(maxTextures)), {
			default: UniformGroup.from({ uSamplers: Array.from({length: maxTextures}, (_, i) => i) }, true)
		})
	}
}
