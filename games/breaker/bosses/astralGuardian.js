import BossBase from './bossBase.js';

export default class AstralGuardian extends BossBase {
    onPhaseChange(phase) {
        if (phase === 2) {
            this.game.invertGravity();
            this.game.showBossMessage('astralPhase2');
        } else if (phase === 3) {
            this.game.activateCosmicCore();
            this.game.showBossMessage('astralPhase3');
        }
    }

    onBrickDestroyed() {
        // Patterns ou effets cosmiques
    }

    onVictory() {
        this.game.addDiamonds(5);
        this.game.addXP(500);
        this.game.showBossMessage('astralVictory');
    }
}
