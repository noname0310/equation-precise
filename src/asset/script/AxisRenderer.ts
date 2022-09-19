import { Vector2 } from "three/src/Three";
import { Camera, Color, Component, CssLineRenderer, GameObject, PrefabRef } from "the-world-engine";
import { CameraController } from "./CameraController";

export class AxisRenderer extends Component {
    public override readonly disallowMultipleComponent = true;
    public override readonly requiredComponents = [Camera, CameraController];

    private _camera: Camera|null = null;
    private _cameraController: CameraController|null = null;

    private _lineWidth = 0.01;

    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        this._lineWidth = value;

        if (this._xAxis) {
            this._xAxis.lineWidth = value;
        }

        if (this._yAxis) {
            this._yAxis.lineWidth = value;
        }
    }

    private _axisObject: GameObject|null = null;
    private _xAxisObject: GameObject|null = null;
    private _yAxisObject: GameObject|null = null;
    private _xAxis: CssLineRenderer|null = null;
    private _yAxis: CssLineRenderer|null = null;

    private readonly _tempVector2 = new Vector2();

    private readonly onScreenResize = (width: number, height: number): void => {
        const viewSize = this._camera!.viewSize;
        const aspect = width / height;

        this._xAxis!.point1 = this._tempVector2.set(-viewSize * aspect, 0);
        this._xAxis!.point2 = this._tempVector2.set(viewSize * aspect, 0);
        
        this._yAxis!.point1 = this._tempVector2.set(0, -viewSize);
        this._yAxis!.point2 = this._tempVector2.set(0, viewSize);
    };

    private readonly onZoom = (): void => {
        const screen = this.engine.screen;
        this.onScreenResize(screen.width, screen.height);
    };

    public awake(): void {
        this._camera = this.gameObject.getComponent(Camera)!;
        this._cameraController = this.gameObject.getComponent(CameraController)!;

        this._cameraController.onZoom.addListener(this.onZoom);
        this.engine.screen.onResize.addListener(this.onScreenResize);

        const xAxisObject = new PrefabRef<GameObject>();
        const yAxisObject = new PrefabRef<GameObject>();
        const xAxisComponent = new PrefabRef<CssLineRenderer>();
        const yAxisComponent = new PrefabRef<CssLineRenderer>();

        this._axisObject = this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("axis-renderer-axis")
                .withChild(this.engine.instantiater.buildGameObject("axis-renderer-x-axis")
                    .withComponent(CssLineRenderer, c => {
                        c.lineWidth = this._lineWidth;
                        c.lineColor = new Color(0.5, 0.5, 0.5);
                    })
                    .getComponent(CssLineRenderer, xAxisComponent)
                    .getGameObject(xAxisObject))

                .withChild(this.engine.instantiater.buildGameObject("axis-renderer-y-axis")
                    .withComponent(CssLineRenderer, c => {
                        c.lineWidth = this._lineWidth;
                        c.lineColor = new Color(0.5, 0.5, 0.5);
                    })
                    .getComponent(CssLineRenderer, yAxisComponent)
                    .getGameObject(yAxisObject))
        );

        this._xAxisObject = xAxisObject.ref!;
        this._yAxisObject = yAxisObject.ref!;
        this._xAxis = xAxisComponent.ref!;
        this._yAxis = yAxisComponent.ref!;

        this.onZoom();
    }

    private readonly _lastCameraPosition = new Vector2(NaN, NaN);

    public update(): void {
        const cameraPosition = this._camera!.transform.position;
        const cameraX = cameraPosition.x;
        const cameraY = cameraPosition.y;

        const lastCameraPosition = this._lastCameraPosition;
        if (lastCameraPosition.x === cameraX && lastCameraPosition.y === cameraY) return;
        lastCameraPosition.x = cameraX;
        lastCameraPosition.y = cameraY;

        this._xAxisObject!.transform.position.x = cameraX;
        this._yAxisObject!.transform.position.y = cameraY;
    }

    public onDestroy(): void {
        this._cameraController!.onZoom.removeListener(this.onZoom);
        this.engine.screen.onResize.removeListener(this.onScreenResize);

        this._axisObject?.destroy();
        this._axisObject = null;
        this._xAxisObject = null;
        this._yAxisObject = null;
        this._xAxis = null;
        this._yAxis = null;
    }
}
