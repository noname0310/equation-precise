import { Bootstrapper as BaseBootstrapper, SceneBuilder } from "the-world-engine";

export class Bootstrapper extends BaseBootstrapper {
    public run(): SceneBuilder {
        return this.sceneBuilder;
    }
}
