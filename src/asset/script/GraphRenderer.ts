import { Vector2, Vector3 } from "three/src/Three";
import {
    Camera,
    Component,
    CoroutineIterator,
    CssHtmlElementRenderer,
    PrefabRef
} from "the-world-engine";
import Queue from "js-sdsl/dist/esm/Queue/Queue";

export class GraphRenderer extends Component {
    private readonly _chunkSize = 1;
    private readonly _chunkObjectPool: CssHtmlElementRenderer[] = [];

    private getChunkObject(): CssHtmlElementRenderer {
        let chunkObject = this._chunkObjectPool.pop();
        if (!chunkObject) {
            const renderer = new PrefabRef<CssHtmlElementRenderer>();
            this.engine.scene.addChildFromBuilder(
                this.engine.instantiater.buildGameObject("chunk-object")
                    .active(false)
                    .withComponent(CssHtmlElementRenderer, c => {
                        const div = document.createElement("div");
                        div.style.border = "1px solid black";
                        c.element = div;
                        c.elementWidth = this._chunkSize;
                        c.elementHeight = this._chunkSize;
                    })
                    .getComponent(CssHtmlElementRenderer, renderer)
            );
            chunkObject = renderer.ref!;
        }

        chunkObject.gameObject.activeSelf = true;
        return chunkObject;
    }

    private returnChunkObject(chunkObject: CssHtmlElementRenderer): void {
        chunkObject.gameObject.activeSelf = false;
        this._chunkObjectPool.push(chunkObject);
    }

    private readonly _activeChunks = new Map<`${number}_${number}`, CssHtmlElementRenderer>();

    private *renderChunk(camera: Camera): CoroutineIterator {
        let procedureStartTime = performance.now();

        //cull chunks
        for (const chunkKey of this._activeChunks.keys()) {
            const chunkX = parseInt(chunkKey.split("_")[0]);
            const chunkY = parseInt(chunkKey.split("_")[1]);

            if (this.is2DFrustumCulled(camera, chunkX, chunkY)) {
                this.returnChunkObject(this._activeChunks.get(chunkKey)!);
                this._activeChunks.delete(chunkKey);
            }
        }

        //if cull took more than 100ms, yield
        if (100 < performance.now() - procedureStartTime) {
            procedureStartTime = performance.now();
            yield null;
        }

        //render chunks
        const cameraPosition = camera.transform.position;
        const cameraPositionX = Math.floor(cameraPosition.x / this._chunkSize);
        const cameraPositionY = Math.floor(cameraPosition.y / this._chunkSize);

        const queue = new Queue<Vector2>();
        const visited = new Set<`${number}_${number}`>();
        queue.push(new Vector2(cameraPositionX, cameraPositionY));

        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];

        let a = 0;

        while (!queue.empty()) {
            //if render took more than 100ms, yield
            if (100 < performance.now() - procedureStartTime) {
                procedureStartTime = performance.now();
                yield null;
            }
            //debug throttle
            if (a++ % 10 == 0) yield null;

            const chunkX = queue.front()!.x;
            const chunkY = queue.front()!.y;
            queue.pop();

            if (this.is2DFrustumCulled(camera, chunkX, chunkY)) continue;

            const chunkKey: `${number}_${number}` = `${chunkX}_${chunkY}`;
            if (visited.has(chunkKey)) continue;
            visited.add(chunkKey);

            for (let i = 0; i < 4; i++) {
                const newChunkX = chunkX + dx[i];
                const newChunkY = chunkY + dy[i];
                queue.push(new Vector2(newChunkX, newChunkY));
            }

            if (this._activeChunks.has(chunkKey)) continue;

            const chunkObject = this.getChunkObject();
            this._activeChunks.set(chunkKey, chunkObject);

            const chunkObjectTransform = chunkObject.gameObject.transform;
            chunkObjectTransform.position.set(chunkX * this._chunkSize, chunkY * this._chunkSize, 0);
        }
    }

    private readonly _lastCameraPosition = new Vector2(NaN, NaN);
    private _lastCameraViewSize = NaN;

    public update(): void {
        const camera = this.engine.cameraContainer.camera;
        if (!camera) return;

        const cameraPosition = camera.transform.position;
        const lastCameraPosition = this._lastCameraPosition;
        if (cameraPosition.x === lastCameraPosition.x &&
            cameraPosition.y === lastCameraPosition.y &&
            camera.viewSize === this._lastCameraViewSize) return;
        lastCameraPosition.set(cameraPosition.x, cameraPosition.y);
        this._lastCameraViewSize = camera.viewSize;
        
        this.startCoroutine(this.renderChunk(camera));
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

        return !chunkIsInFrustum;
    }
}
