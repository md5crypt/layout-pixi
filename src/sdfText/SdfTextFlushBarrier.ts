import { Renderer } from "@pixi/core"
import { DisplayObject } from "@pixi/display"
import { SdfTextRenderer } from "./SdfTextRenderer"

export class SdfTextFlushBarrier extends DisplayObject {
	public sortDirty = false

	public calculateBounds() {
		// no-op
	}

	public removeChild(child: DisplayObject) {
		// no-op
	}

	public render(renderer: Renderer) {
		if (this.visible && this.renderable) {
			const plugin = (renderer.plugins.sdfText as SdfTextRenderer)
			if (!plugin.empty) {
				renderer.batch.flush()
				plugin.flush()
			}
		}
	}
}

export default SdfTextFlushBarrier
