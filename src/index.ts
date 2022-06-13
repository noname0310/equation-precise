import { Game } from "the-world-engine";
import { Bootstrapper } from "./asset/Bootstrapper";

const game = new Game(document.getElementById("game_view")!, true);
game.run(Bootstrapper);
game.inputHandler.startHandleEvents();

const epp = import("./epp");
epp.then(epp => {
    epp.emit("x + y = z", 0.001);
});
