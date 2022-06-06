import { Vector2, Vector3 } from "three/src/Three";
import { 
    Bootstrapper as BaseBootstrapper,
    Camera,
    Color,
    Css2DEdgeRenderer,
    PrefabRef,
    SceneBuilder
} from "the-world-engine";
import { CameraController } from "./script/CameraController";
import { CameraRelativeScaleController } from "./script/CameraRelativeScaleController";
import { GraphRenderer } from "./script/GraphRenderer";
import { GridRenderer } from "./script/GridRenderer";
import { AxisRenderer } from "./script/AxisRenderer";

export class Bootstrapper extends BaseBootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        const cameraController = new PrefabRef<CameraController>();

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("graph-renderer")
                .withComponent(GraphRenderer)
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 2;
                    const renderer = c.gameObject.getComponent(GraphRenderer)!;
                    c.onZoom = (viewSize: number): void => {
                        renderer.viewScale = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                }))

            .withChild(instantiater.buildGameObject("camera", new Vector3(0, 0, -1))
                .withComponent(Camera, c => {
                    c.viewSize = 3;
                })
                .withComponent(CameraController)
                .getComponent(CameraController, cameraController)
                .withComponent(GridRenderer)
                .withComponent(AxisRenderer)
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 0.003;
                    const renderer = c.gameObject.getComponent(GridRenderer)!;
                    c.onZoom = (viewSize: number): void => {
                        renderer.viewScale = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                }))

            .withChild(instantiater.buildGameObject("test-line")
                .active(false)
                .withComponent(Css2DEdgeRenderer, c => {
                    c.viewScale = 0.01;
                    c.edgeColor = new Color(0, 0, 0);

                    const sampleInterval = 1;
                    const sinSamples: Vector2[] = [];
                    for (let i = -10; i < 10; i += sampleInterval) {
                        sinSamples.push(new Vector2(i, Math.sin(i)));
                    }

                    c.points = sinSamples;

                })
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 10;
                    const renderer = c.gameObject.getComponent(Css2DEdgeRenderer)!;
                    c.onZoom = (viewSize: number): void => {
                        renderer.edgeWidth = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                }))
        ;
    }
}
