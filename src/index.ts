import { Game } from "the-world-engine";
import { Bootstrapper } from "./asset/Bootstrapper";

const game = new Game(document.getElementById("game_view")!, true);
game.run(Bootstrapper);
game.inputHandler.startHandleEvents();

const epp = import("./epp");
epp.then(epp => {
    (globalThis as any).epp = (expr: string): ((x: number, y: number) => boolean) => ["x", "y", "return " + epp.emit(expr, 0.001)] as any;
});
