import { Vector2, Vector3 } from "three/src/Three";
import {
    Camera,
    Component,
    CoroutineIterator,
    CssHtmlElementRenderer,
    PrefabRef
} from "the-world-engine";
import Queue from "js-sdsl/dist/esm/container/OtherContainer/Queue";
import { GraphMath } from "./GraphMath";

export class GraphRenderer extends Component {
    public get equation(): (x: number) => number {
        return this._equation;
    }

    public set equation(value: (x: number) => number) {
        this._equation = value;

        const camera = this.engine.cameraContainer.camera;
        if (!camera) return;

        this.clearChunks();
        this.startCoroutine(this.renderChunk(camera));
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _equation = (_x: number): number => NaN;

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

    private readonly _cameraRelativeChunkSize = 2;
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
                        const canvas = document.createElement("canvas");
                        canvas.style.width = "100%";
                        canvas.style.height = "100%";
                        canvas.style.position = "absolute";
                        canvas.style.top = "0";
                        canvas.style.left = "0";
                        canvas.width = this._chunkResolution;
                        canvas.height = this._chunkResolution;
                        c.element = canvas;
                    })
                    .getComponent(CssHtmlElementRenderer, renderer)
            );
            chunkObject = renderer.ref!;
        }

        chunkObject.gameObject.activeSelf = true;
        return chunkObject;
    }

    private releaseChunkObject(chunkObject: CssHtmlElementRenderer): void {
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
                this.releaseChunkObject(this._activeChunks.get(chunkKey)!);
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

        let debugThrottleV = 0;

        while (!queue.empty()) {
            //if render took more than 100ms, yield
            if (100 < performance.now() - procedureStartTime) {
                procedureStartTime = performance.now();
                yield null;
            }
            //debug throttle
            if (debugThrottleV++ % 10 == 0) yield null;

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
            this.xSamplingDrawGraph(
                (chunkObject.element! as HTMLCanvasElement).getContext("2d")!,
                this._equation,
                chunkPosition.x - chunkSizeHalf, chunkPosition.x + chunkSizeHalf,
                chunkPosition.x, chunkPosition.y,
                this._viewScale / this._chunkSize
            );

            // eslint-disable-next-line no-constant-condition
            if (false) {
                this.shaderDrawGraph(
                    (chunkObject.element! as HTMLCanvasElement).getContext("webgl2")!
                );
            }
        }
    }

    private clearChunks(): void {
        for (const chunkObject of this._activeChunks.values()) {
            this.releaseChunkObject(chunkObject);
        }
        this._activeChunks.clear();
    }

    private readonly _sampleCount = 32 * 10;

    private xSamplingDrawGraph(
        ctx: CanvasRenderingContext2D,
        func: (x: number) => number,
        left: number, right: number,
        offsetX: number, offsetY: number,
        strokeWidth: number
    ): void {
        ctx.clearRect(0, 0, this._chunkResolution, this._chunkResolution);

        // ctx.beginPath();
        // ctx.arc(this._chunkResolution * 0.5, this._chunkResolution * 0.5, this._chunkResolution * 0.5, 0, Math.PI * 2);
        // ctx.stroke();
        // ctx.closePath();

        ctx.beginPath();
        const step = (right - left) / this._sampleCount;
        for (let x = left - step; x <= right + step; x += step) {
            const y = func(x);

            const localX = x - offsetX;
            const localY = y - offsetY;

            const canvasX = localX * this._chunkResolution / this._chunkSize + this._chunkResolution * 0.5;
            const canvasY = -localY * this._chunkResolution / this._chunkSize + this._chunkResolution * 0.5;

            ctx.lineTo(canvasX, canvasY);
        }
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
        ctx.closePath();
    }

    private _program: WebGLProgram|null = null;
    private getProgram(gl: WebGL2RenderingContext): WebGLProgram {
        if (!this._program) {
            const program = gl.createProgram()!;
            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertexShader, `
                precision mediump float;
                attribute vec2 position;
                varying vec2 uv;
                void main() {
                    uv = position;
                    gl_Position = vec4(position, 0, 1);
                }
            `);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragmentShader, `
                precision mediump float;
                varying vec2 uv;
                uniform sampler2D texture;
                void main() {
                    gl_FragColor = texture2D(texture, uv);
                }
            `);
            gl.compileShader(fragmentShader);

            gl.attachShader(program, vertexShader);
            gl.deleteShader(vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.deleteShader(fragmentShader);
            gl.linkProgram(program);

            const log = gl.getProgramInfoLog(program);
            if (log) console.error(log);

            this._program = program;
        }
        return this._program!;
    }

    private shaderDrawGraph(gl: WebGL2RenderingContext): void {
        const program = this.getProgram(gl);
        gl.useProgram(program);
        
        const positionLocation = gl.getAttribLocation(program, "position");
        const uvLocation = gl.getAttribLocation(program, "uv");
        const textureLocation = gl.getUniformLocation(program, "texture");

        const positionBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uvBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(uvLocation);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
        
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        const textureData = new Uint8Array(this._chunkResolution * this._chunkResolution * 4);
        for (let i = 0; i < this._chunkResolution * this._chunkResolution; i++) {
            textureData[i * 4 + 0] = 255;
            textureData[i * 4 + 1] = 255;
            textureData[i * 4 + 2] = 255;
            textureData[i * 4 + 3] = 255;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this._chunkResolution, this._chunkResolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);

        gl.uniform1i(textureLocation, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private readonly _lastCameraPosition = new Vector2(NaN, NaN);
    private _lastCameraViewSize = NaN;
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

        const chunkStep = GraphMath.computeLod(viewSize);
        if (chunkStep !== this._lastChunkStep) {
            this.clearChunks();
            this._lastChunkStep = chunkStep;
            this._chunkSize = this._lastChunkStep * this._cameraRelativeChunkSize;
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

    public onDestroy(): void {
        this.clearChunks();
        const chunkObjectPool = this._chunkObjectPool;
        for (let i = chunkObjectPool.length - 1; i >= 0; i--) {
            const chunkObject = chunkObjectPool[i];
            chunkObject.gameObject.destroy();
        }

        this._chunkObjectPool.length = 0;
    }
}
