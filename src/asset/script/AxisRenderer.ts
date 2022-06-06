import { Vector2 } from "three/src/Three";
import { Camera, Component, Css2DLineRenderer } from "the-world-engine";

export class AxisRenderer extends Component {
    public override readonly disallowMultipleComponent = true;
    public override readonly requiredComponents = [Camera];

    private _lineWidth = 0.01;

    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        this._lineWidth = value;
    }

    private _xAxis: Css2DLineRenderer|null = null;
    private _yAxis: Css2DLineRenderer|null = null;

    private readonly onScreenResize = (width: number, height: number): void => {
        this._xAxis!.point2 = new Vector2(width, 0);
        this._yAxis!.point2 = new Vector2(0, height);
    };

    public awake(): void {
        this.engine.screen.onResize.addListener(this.onScreenResize);

        this.gameObject.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("axis-renderer-axis")
                .withComponent(Css2DLineRenderer, c => {
                    this._xAxis = c;
                    c.point1 = new Vector2(0, 0);
                    c.point2 = new Vector2(0, 0);
                    c.lineWidth = this._lineWidth;
                })
                .withComponent(Css2DLineRenderer, c => {
                    this._yAxis = c;
                    c.point1 = new Vector2(0, 0);
                    c.point2 = new Vector2(0, 0);
                    c.lineWidth = this._lineWidth;
                })
        );
    }
}
