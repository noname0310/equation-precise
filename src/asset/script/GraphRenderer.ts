import { Vector2, Vector3 } from "three/src/Three";
import {
    Camera,
    //Camera,
    Component
    //CssHtmlElementRenderer,
    //PrefabRef
} from "the-world-engine";

export class GraphRenderer extends Component {
    private readonly _chunkSize = 1;
    //private readonly _map = new Map<`${number}_${number}`, CssHtmlElementRenderer>();

    private readonly _lastCameraPosition = new Vector2(NaN, NaN);

    public update(): void {
        const camera = this.engine.cameraContainer.camera;
        if (!camera) return;

        const cameraPosition = camera.transform.position;
        if (cameraPosition.x === this._lastCameraPosition.x && cameraPosition.y === this._lastCameraPosition.y) return;

        this._lastCameraPosition.set(cameraPosition.x, cameraPosition.y);
        
        this.updateDebugChunkBounds(camera);
    }

    private updateDebugChunkBounds(camera: Camera): void {
        console.log(this.is2DFrustumCulled(camera, 1, 0));
    }

    private readonly _tempVector3 = new Vector3();

    private is2DFrustumCulled(camera: Camera, chunkX: number, chunkY: number): boolean {
        const chunkSize = this._chunkSize;
        const position = this._tempVector3.set(chunkX * chunkSize, chunkY * chunkSize, 0);
        const cameraRelativePosition = camera.transform.inverseTransformPoint(position);
        
        const viewSizeScalar = camera.viewSize;
        const aspectRatio = this.engine.screen.width / this.engine.screen.height;
        const frustumLeft = -viewSizeScalar * aspectRatio;
        const frustumRight = viewSizeScalar * aspectRatio;
        const frustumTop = viewSizeScalar;
        const frustumBottom = -viewSizeScalar;

        const chunkSizeHalf = chunkSize * 0.5;
        const chunkLeft = -chunkSizeHalf + cameraRelativePosition.x;
        const chunkRight = chunkSizeHalf + cameraRelativePosition.x;
        const chunkTop = chunkSizeHalf + cameraRelativePosition.y;
        const chunkBottom = -chunkSizeHalf + cameraRelativePosition.y;

        const chunkLeftIsInFrustum = frustumLeft <= chunkLeft && chunkLeft <= frustumRight;
        const chunkRightIsInFrustum = frustumLeft <= chunkRight && chunkRight <= frustumRight;
        const chunkTopIsInFrustum = frustumBottom <= chunkTop && chunkTop <= frustumTop;
        const chunkBottomIsInFrustum = frustumBottom <= chunkBottom && chunkBottom <= frustumTop;

        const chunkIsInFrustum = (chunkLeftIsInFrustum || chunkRightIsInFrustum) && (chunkTopIsInFrustum || chunkBottomIsInFrustum);

        return chunkIsInFrustum;
    }

    // private readonly _debugBoundObjects = new Map<`${number}_${number}`, CssHtmlElementRenderer>();
    // private drawDebugChunkBounds(chunkX: number, chunkY: number): void {
    //     let debugBoundObject = this._debugBoundObjects.get(`${chunkX}_${chunkY}`);
    //     if (!debugBoundObject) {
    //         const cssRenderer = new PrefabRef<CssHtmlElementRenderer>();
    //         this.gameObject.addChildFromBuilder(
    //             this.engine.instantiater.buildGameObject(`debug_chunk_bound_${chunkX}_${chunkY}`)
    //                 .withComponent(CssHtmlElementRenderer, c => {
    //                     const div = document.createElement("div");
    //                     c.element = div;
    //                     c.elementWidth = this._chunkSize;
    //                     c.elementHeight = this._chunkSize;
    //                 })
    //                 .getComponent(CssHtmlElementRenderer, cssRenderer));

    //         debugBoundObject = cssRenderer.ref!;
    //     }

    //     debugBoundObject.transform.position.set(
    //         chunkX * this._chunkSize,
    //         chunkY * this._chunkSize,
    //         debugBoundObject.transform.position.z
    //     );
    // }
}
