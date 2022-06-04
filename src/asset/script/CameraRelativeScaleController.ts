import { Component } from "the-world-engine";
import { CameraController } from "./CameraController";

export class CameraRelativeScaleController extends Component {
    private _cameraController: CameraController|null = null;
    private _cameraRelativeScale = 1;

    public onZoom: (cameraRelativeScale: number) => void = (): void => {
        // empty
    };

    private readonly onZoomInternal: (viewSize: number) => void = (): void => {
        this.onZoom(this._cameraController!.viewSize * this._cameraRelativeScale);
    };

    public get cameraController(): CameraController|null {
        return this._cameraController;
    }

    public set cameraController(value: CameraController|null) {
        if (this._cameraController) {
            this._cameraController.onZoom.removeListener(this.onZoomInternal);
        }

        this._cameraController = value;

        if (value) {
            value.onZoom.addListener(this.onZoomInternal);
            this.onZoomInternal(value.viewSize);
        }
    }

    public get cameraRelativeScale(): number {
        return this._cameraRelativeScale;
    }

    public set cameraRelativeScale(value: number) {
        this._cameraRelativeScale = value;
        if (this._cameraController) {
            this.onZoomInternal(this._cameraController.viewSize);
        }
    }
}
