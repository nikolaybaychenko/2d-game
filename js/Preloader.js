RENAME_ME.Preloader = function(game) {
    this.ready = false;
};

RENAME_ME.Preloader.prototype = {

    preload: function() {
        // loading image of background
        this.game.load.image('space', 'assets/imgs/space-background.jpg');
        // loading sprite of ship
        this.game.load.image('ship', 'assets/imgs/ship.gif');
        // loading sprite of asteroid
        this.game.load.image('asteroid', 'assets/imgs/asteroid.png');
    },

    create: function() {
        this.game.stage.backgroundColor = '#ffffff';
        var logo = this.add.sprite(this.world.width/2, this.world.height/2, 'appsbude');
        logo.anchor.set(0.5, 0.5);

        this.game.time.events.add(Phaser.Timer.SECOND * 2.0, function() {

            var tween = this.add.tween(logo)
                .to({alpha: 0}, 750, Phaser.Easing.Linear.none);

            tween.onComplete.add(function() {
                logo.destroy();
                this.startGame();
            }, this);

            tween.start();
        }, this);
    },

    startGame: function() {
        this.state.start('MainMenu');
    }

};
