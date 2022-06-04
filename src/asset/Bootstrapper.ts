import { Vector2, Vector3 } from "three/src/Three";
import { 
    Bootstrapper as BaseBootstrapper,
    Camera,
    Color,
    Css2DEdgeRenderer,
    CssHtmlElementRenderer,
    PrefabRef,
    SceneBuilder
} from "the-world-engine";
import { CameraController } from "./script/CameraController";
import { CameraRelativeScaleController } from "./script/CameraRelativeScaleController";
import { GraphRenderer } from "./script/GraphRenderer";

export class Bootstrapper extends BaseBootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        const cameraController = new PrefabRef<CameraController>();

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("graph-renderer")
                .withComponent(GraphRenderer))

            .withChild(instantiater.buildGameObject("test-object", new Vector3(1, 0, 0))
                .withComponent(CssHtmlElementRenderer, c => {
                    const div = document.createElement("div");
                    div.style.border = "1px solid black";
                    c.element = div;
                    c.elementWidth = 1;
                    c.elementHeight = 1;
                }))
            
            .withChild(instantiater.buildGameObject("test-object", new Vector3(0, 0, 0))
                .withComponent(CssHtmlElementRenderer, c => {
                    const div = document.createElement("div");
                    div.style.border = "1px solid black";
                    c.element = div;
                    c.elementWidth = 1;
                    c.elementHeight = 1;
                }))

            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera, c => {
                    c.viewSize = 3;
                })
                .withComponent(CameraController)
                .getComponent(CameraController, cameraController))

            .withChild(instantiater.buildGameObject("test-line")
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
