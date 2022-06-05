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
    private _viewScale = 0.01;

    public get viewScale(): number {
        return this._viewScale;
    }

    public set viewScale(value: number) {
        this._viewScale = value;
        for (const chunkObject of this._activeChunks.values()) {
            chunkObject.viewScale = value;
        }
    }

    private readonly _cameraRelativeChunkSize = 0.5;
    private readonly _chunkResolution = 512;
    private _chunkSize = NaN;
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
                        const canvas = document.createElement("canvas");
                        canvas.style.width = "100%";
                        canvas.style.height = "100%";
                        canvas.width = this._chunkResolution;
                        canvas.height = this._chunkResolution;
                        div.appendChild(canvas);
                        c.element = div;
                        const ctx = canvas.getContext("2d")!;
                        //drawing
                        ctx.arc(512 / 2, 512 / 2, 300, 0, 2 * Math.PI);
                        ctx.fillStyle = "#39C5BB44";
                        ctx.fill();
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
        console.log("renderChunk");
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
        console.log("cull chunks", performance.now() - procedureStartTime);

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

        //let a = 0;

        while (!queue.empty()) {
            //if render took more than 100ms, yield
            if (100 < performance.now() - procedureStartTime) {
                procedureStartTime = performance.now();
                yield null;
            }
            //debug throttle
            //if (a++ % 10 == 0) yield null;

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
            chunkObject.elementWidth = this._chunkSize;
            chunkObject.elementHeight = this._chunkSize;
            
            this._activeChunks.set(chunkKey, chunkObject);

            const chunkObjectTransform = chunkObject.gameObject.transform;
            chunkObjectTransform.position.set(chunkX * this._chunkSize, chunkY * this._chunkSize, 0);
            
            const chunkPosition = chunkObject.transform.position;
            const chunkSizeHalf = this._chunkSize * 0.5;
            chunkObject.viewScale = this._viewScale;
            this.computeSamples(
                (x: number) => Math.sin(x) * 3,
                chunkPosition.x - chunkSizeHalf, chunkPosition.x + chunkSizeHalf,
                chunkPosition.y - chunkSizeHalf, chunkPosition.y + chunkSizeHalf,
                chunkPosition.x, chunkPosition.y
            );
        }
        console.log("render chunks", performance.now() - procedureStartTime);
    }

    private clearChunks(): void {
        for (const chunkObject of this._activeChunks.values()) {
            this.returnChunkObject(chunkObject);
        }
        this._activeChunks.clear();
    }

    private readonly _sampleCount = 100;

    private computeSamples(
        func: (x: number) => number,
        left: number, right: number, top: number, bottom: number,
        offsetX: number, offsetY: number
    ): Vector2[] {
        const samples: Vector2[] = [];
        const step = (right - left) / this._sampleCount;
        for (let i = 0; i < this._sampleCount; i++) {
            const x = left + i * step;
            const y = func(x);
            if (top <= y && y <= bottom) {
                samples.push(new Vector2(x - offsetX, y - offsetY));
            }
        }
        samples.push(new Vector2(right - offsetX, func(right) - offsetY));
        return samples;
    }

    private readonly _lastCameraPosition = new Vector2(NaN, NaN);
    private _lastCameraViewSize = NaN;
    private readonly _chunkSizeStep = 100;
    private _lastChunkStep = NaN;

    public update(): void {
        const camera = this.engine.cameraContainer.camera;
        if (!camera) return;

        const viewSize = camera.viewSize;
        const cameraPosition = camera.transform.position;
        const lastCameraPosition = this._lastCameraPosition;
        if (cameraPosition.x === lastCameraPosition.x &&
            cameraPosition.y === lastCameraPosition.y &&
            viewSize === this._lastCameraViewSize) return;
        lastCameraPosition.set(cameraPosition.x, cameraPosition.y);
        this._lastCameraViewSize = viewSize;
        
        const chunkStep = Math.floor(Math.sqrt(viewSize) / this._chunkSizeStep) * 100 / 10;
        console.log(chunkStep);
        if (chunkStep !== this._lastChunkStep) {
            this.clearChunks();
            this._lastChunkStep = chunkStep;
            this._chunkSize = viewSize * this._cameraRelativeChunkSize;
        }
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

        let chunkLeftIsInFrustum;
        let chunkRightIsInFrustum;
        if (chunkLeft <= frustumLeft && frustumRight <= chunkRight) {
            chunkLeftIsInFrustum = true;
            chunkRightIsInFrustum = true;
        } else {
            chunkLeftIsInFrustum = frustumLeft <= chunkLeft && chunkLeft <= frustumRight;
            chunkRightIsInFrustum = frustumLeft <= chunkRight && chunkRight <= frustumRight;
        }

        let chunkTopIsInFrustum;
        let chunkBottomIsInFrustum;
        if (chunkBottom <= frustumBottom && frustumTop <= chunkTop) {
            chunkTopIsInFrustum = true;
            chunkBottomIsInFrustum = true;
        } else {
            chunkTopIsInFrustum = frustumBottom <= chunkTop && chunkTop <= frustumTop;
            chunkBottomIsInFrustum = frustumBottom <= chunkBottom && chunkBottom <= frustumTop;
        }

        const chunkIsInFrustum = (chunkLeftIsInFrustum || chunkRightIsInFrustum) && (chunkTopIsInFrustum || chunkBottomIsInFrustum);

        return !chunkIsInFrustum;
    }
}
