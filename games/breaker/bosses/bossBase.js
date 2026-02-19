// Classe de base pour tous les boss Breaker
export default class BossBase {
    constructor(game) {
        this.game = game;
        this.phase = 1;
        this.totalBricks = 0;
        this.lastPhase = 1;
    }

    init(totalBricks) {
        this.totalBricks = totalBricks;
        this.phase = 1;
        this.lastPhase = 1;
    }

    update(bricksRemaining) {
        if (!this.totalBricks) return;
        const percent = bricksRemaining / this.totalBricks;
        if (this.phase < 2 && percent <= 0.66) {
            this.phase = 2;
            this.onPhaseChange(2);
        }
        if (this.phase < 3 && percent <= 0.33) {
            this.phase = 3;
            this.onPhaseChange(3);
        }
    }

    onPhaseChange(phase) {
        // À surcharger dans les sous-classes
    }

    onBrickDestroyed() {
        // Hook à surcharger
    }

    onVictory() {
        // Hook à surcharger
    }
}