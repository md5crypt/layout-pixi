import { IPointData3d } from "./IPointData3d.js"

export class Point3d implements IPointData3d {
	public x = 0
	public y = 0
	public z = 0

	constructor(x = 0, y = 0, z = 0) {
		this.x = x
		this.y = y
		this.z = z
	}

	public clone() {
		return new Point3d(this.x, this.y, this.z)
	}

	public copyFrom(p: IPointData3d) {
		return this.set(p.x, p.y, p.z)
	}


	public copyTo(p: Point3d) {
		p.set(this.x, this.y, this.z)
		return p
	}


	public equals(p: IPointData3d): boolean {
		return (p.x === this.x) && (p.y === this.y) && (p.z == this.z)
	}

	public set(x = 0, y = x, z = 0) {
		this.x = x
		this.y = y
		this.z = z
		return this
	}
}
