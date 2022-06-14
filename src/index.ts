import { Game } from "the-world-engine";
import { Bootstrapper } from "./asset/Bootstrapper";
import { ParserBind } from "./asset/script/ParserBind";

ParserBind.init().then(() => {
    (globalThis as any).ParserBind = ParserBind;
    const game = new Game(document.getElementById("game_view")!, true);
    game.run(Bootstrapper);
    game.inputHandler.startHandleEvents();
});
