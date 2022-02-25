import { Shader, Program } from "@pixi/core"

const shaderFrag = `
varying vec2 vTextureCoord;
varying float vFWidth;
varying vec4 vColor;

uniform sampler2D uSampler;

void main(void) {
	vec4 texColor = texture2D(uSampler, vTextureCoord);
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

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying float vFWidth;
varying vec4 vColor;

void main(void) {
	gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
	vTextureCoord = aTextureCoord;
	vColor = aColor;
	vFWidth = aFWidth;
}`


export default class SdfTextShader extends Shader {
	constructor() {
		super(new Program(shaderVert, shaderFrag))
	}
}
