import { Shader, Program } from "@pixi/core"

const shaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;

void main(void) {
	vec4 color = texture2D(uSampler, vTextureCoord);
	gl_FragColor = vec4(vColor.b * vColor.a, vColor.g * vColor.a, vColor.r * vColor.a, vColor.a) * color;
}`


const shaderVert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main(void) {
	gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
	vTextureCoord = aTextureCoord;
	vColor = aColor;
}`

export default class SdfTextShader extends Shader {
	constructor() {
		super(new Program(shaderVert, shaderFrag))
	}
}
