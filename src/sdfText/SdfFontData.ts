export interface SdfFontCharData {
	id: number
	index: number
	char: string
	width: number
	height: number
	xoffset: number
	yoffset: number
	xadvance: number
	chnl: number
	x: number
	y: number
	page: number
}

export interface SdfFontInfoData {
	face: string
	size: number
	bold: number
	italic: number
	charset: string[]
	unicode: number
	stretchH: number
	smooth: number
	aa: number
	padding: number[]
	spacing: number[]
}

export interface SdfFontCommonData {
	lineHeight: number
	base: number
	scaleW: number
	scaleH: number
	pages: number
	packed: number
	alphaChnl: number
	redChnl: number
	greenChnl: number
	blueChnl: number
}

export interface SdfFontDistanceFieldData {
	fieldType: string
	distanceRange: number
}

export interface SdfFontKerningData {
	first: number
	second: number
	amount: number
}

export interface SdfFontData {
	pages: string[]
	chars: SdfFontCharData[]
	info: SdfFontInfoData
	common: SdfFontCommonData
	distanceField: SdfFontDistanceFieldData
	kernings: SdfFontKerningData[]
}

export default SdfFontData
