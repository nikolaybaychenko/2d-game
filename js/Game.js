// TODO: add 3 types of asteroids: default deadly one (big), medium, small.
//  	 delete/change code related to the previous game idea

RENAME_ME.Game = function(game) {
	this.difficultyParams = {
		normal: {
			param2or3Fragments: 0.2
		},
		hard: {
			param2or3Fragments: 0.5
		}
	};

	this.ship;
	this.healthBar;
	this.healthBarHeight = 15;
	this.healthBarWidth = 180;
	this.fireReloadTime = 0;
	this.asteroids;
	this.numAsteroids = 80; // in pool (alive & killed)
	this.bullets;
	this.numBulletsInPool = 20;

	//this.maxAstersOnScreen = 10;
	this.score;
	this.scoreText;
	this.stateText;
	//this.bgScrollSpeed = 0;

	this.XYScaleSpeedForAsteroid = {}; // 4 params for an asteroid-to-spawn
	this.asteroidMaxScale = 0.8;
	this.asteroidMinScale = 0.4;
	this.asteroidMaxSpeed = 4;
	this.asteroidMinSpeed = 2;
	this.asteroidSmallScale = this.asteroidMinScale / 3;
	this.asteroidEvenSmallerScale = this.asteroidMinScale / 3.5;
	this.counterToControlAsteroidsSpawn = -6; // try to spawn then <= 0

	this.cursors;
	this.fireBtn;

	// more funny constants:
	this.thirdTheScreen = game.height / 3;
	this.fragmentsScatterMaxDistance = 40;
};

RENAME_ME.Game.prototype = {
	create: function() {
		this.score = 0;
		// Adjusting physics
	    this.game.physics.startSystem(Phaser.Physics.ARCADE);
	    // Adjusting background
	    this.game.add.sprite(0, 0, 'space');

		this.ship.health = 100;
		// healthbar plugin - https://github.com/bmarwane/phaser.healthbar
		this.healthBar = new HealthBar(this.game, {x: this.game.width - this.healthBarWidth / 2 - 10
												 , y: this.game.height - 17
												 , height: this.healthBarHeight
												 , width: this.healthBarWidth});
		this.healthBar.setPercent(this.ship.health);
		//this.healthBar.setFixedToCamera(true);
	    // Adding ship
	    this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 70, 'ship');
	    // Adjusting physics to the ship
	    this.game.physics.arcade.enable(this.ship);
	    // Setting gravity of ship to 0
	    this.ship.body.gravity.y = 0;
	    // Initial velocity of the ship
	    this.ship.body.velocity.x = 0;
	    this.ship.body.velocity.y = 0;
	    //ship's anchor is in the middle of the sprite
	    this.ship.anchor.setTo(0.5, 0.5);
	    //this.game.camera.follow(this.ship);
	    //deadzone explained here http://phaser.io/examples/v2/camera/deadzone
	    //this.game.camera.deadzone = new Phaser.Rectangle(100, 30, this.game.width - 200, 100);

		// Adding bullets group
		this.bullets = this.game.add.group();
		this.bullets.enableBody = true;
		this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
		this.bullets.createMultiple(this.numBulletsInPool, 'bullet');
		this.bullets.setAll('anchor.x', 0.5);
		this.bullets.setAll('anchor.y', 1);
		this.bullets.setAll('outOfBoundsKill', true);
		this.bullets.setAll('checkWorldBounds', true);

	    // Adding asteroids group
	    this.asteroids = this.game.add.group();
	    // Adjusting physics for asteroids
	    this.asteroids.enableBody = true;
	    // Creating asteroids
	    for (var i = 0; i < this.numAsteroids; ++i)
	    {
	    	this.updateXYScaleSpeedVar();
	        var asteroid = this.asteroids.create(this.XYScaleSpeedForAsteroid['x'], this.XYScaleSpeedForAsteroid['y'], 'asteroid');
			asteroid.speed = this.XYScaleSpeedForAsteroid['speed'];
			asteroid.anchor.setTo(0.5, 0.5);
	        asteroid.scale.setTo(this.XYScaleSpeedForAsteroid['scale'], this.XYScaleSpeedForAsteroid['scale']);

	        ++this.counterToControlAsteroidsSpawn;
	        this.counterToControlAsteroidsSpawn > 0 && asteroid.kill(); //hides rest of the asteroids
	    }

		this.scoreText = this.game.add.text(10, this.game.height - 20, 'score: 0', { fontSize: '15px', fill: '#fff' });

		this.stateText = this.game.add.text(this.game.world.centerX,this.game.world.centerY,' ', { font: '70px Arial', fill: '#fff' });
	    this.stateText.anchor.setTo(0.5, 0.5);
	    this.stateText.visible = false;

	    // Enable controls
	    this.cursors = this.game.input.keyboard.createCursorKeys();
	    this.fireBtn = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	},

	update: function() {
		// Run collision
	    this.game.physics.arcade.overlap(this.ship, this.asteroids, this.asteroidCollision, null, this);
		this.game.physics.arcade.overlap(this.bullets, this.asteroids, this.bulletCollision, null, this);

	    if (this.ship.health <= 0) {
	    	this.gameOver();
	    }
	    else {
	    	//this.tryToSpawnAsteroid();
		    this.asteroids.forEachAlive(function(asteroid)
		    	{
		    		asteroid.y > this.game.height ? asteroid.kill() : asteroid.y += asteroid.speed;
		    	}, this);

		    if (this.ship.alive) {
				// Stand by after movement
				this.ship.body.velocity.setTo(0, 0);
				// Move left
		    	if (this.cursors.left.isDown)
		        {
		            this.ship.body.velocity.x = -200;
		        }
				// Move right
		        else if (this.cursors.right.isDown)
		        {
		            this.ship.body.velocity.x = 200;
		        }

		        //  Firing
		        if (this.fireBtn.isDown) {
					this.fire();
		        }
		    }

		    this.scoreText.text = 'Score: ' + this.score;
	    }
	},

	// The rest of the methods should be in A-Z order


	asteroidCollision: function(ship, asteroid) {
	    // Big asteroids destroy the ship,
	    // smaller ones drain the ship's "health"
	    if (asteroid.scale.x >= this.asteroidMinScale) {
	    	this.ship.damage(100);
	    	this.healthBar.setPercent(this.ship.health);
	    	
	    	this.gameOver();
	    }
	    else {
	    	var healthToDeduce = 25; // btw, JS hoists "vars"/"lets" to the top of a function/block
	    	this.ship.damage(healthToDeduce);
	    	this.healthBar.setPercent(this.ship.health);

	    	asteroid.kill;
	    }
	},

	bulletCollision: function (bullet, asteroid) {
		bullet.kill();

		if (asteroid.scale.x >= this.asteroidMinScale) {
			// spawn the asteroid's debris (i.e. smaller ateroids)
			var numFragmentsMinusOne = Math.random() >= this.difficultyParams.normal.param2or3Fragments ? 1 : 2; //we reuse hitted asteroid as 1 of the fragments
			var fragment;
			var scatterDistance;
			var fragmentScale;

			for (var i = 0; i < numFragmentsMinusOne; ++i) {
				fragment = this.asteroids.getFirstDead();
				scatterDistance = Math.random() * this.fragmentsScatterMaxDistance;
				fragment.x = Math.random() > 0.5 ? asteroid.x - scatterDistance : asteroid.x + scatterDistance;
				fragment.y = asteroid.y - scatterDistance;
				if (asteroid.scale.x >= this.asteroidMinScale) {
					fragmentScale = numFragmentsMinusOne == 2 ? this.asteroidEvenSmallerScale : this.asteroidSmallScale;
					fragment.scale.setTo(fragmentScale, fragmentScale);
				}
				// speed
				fragment.revive();
			}
			// make asteroid its fragment

		}
		else {
			asteroid.kill();
		}

		this.score += 1;

		//  And create an explosion :)		ADD LATTER
		//var explosion = explosions.getFirstExists(false);
		//explosion.reset(alien.body.x, alien.body.y);
		//explosion.play('kaboom', 30, false, true);

	},

	fire: function() {
		// Timing doesn't work, need to fix
		if (this.game.time.now > this.fireReloadTime) {
			//  Grab the first bullet we can from the pool
			var bullet = this.bullets.getFirstExists(false);
			if (bullet) {
				//  And fire it
				bullet.reset(this.ship.x, this.ship.y - 30);
				bullet.body.velocity.y = -400;
				this.fireReloadTime = this.game.time.now + 400;
			}
		}
	},

	gameOver: function() {
		//this.ship.kill(); ship is killed automatically than its health <= 0
		this.stateText.text = " GAME OVER \n  Final score:\n      "+ this.score +"\n (click to restart)";
    	this.stateText.visible = true;

        //the "click to restart" handler
        this.game.input.onTap.addOnce(this.restart, this);
	},

	updateXYScaleSpeedVar: function() {
		this.XYScaleSpeedForAsteroid['x'] = Math.random() * this.game.width;
	    this.XYScaleSpeedForAsteroid['y'] = Math.random() * this.game.height * -2 - this.thirdTheScreen;
	    this.XYScaleSpeedForAsteroid['scale']  = Math.random() * (this.asteroidMaxScale - this.asteroidMinScale) + this.asteroidMinScale;
		this.XYScaleSpeedForAsteroid['speed'] = Math.random() * (this.asteroidMaxSpeed - this.asteroidMinSpeed) + this.asteroidMinSpeed;
	},

	quitGame: function(pointer) {
		this.state.start('MainMenu');
	},

	render: function() {
		/* this.game.debug.body(this.planes[0].getSprite());
		this.game.debug.body(this.planes[1].getSprite());
		this.tubey.getGroup().forEachAlive(this.renderGroup, this);
		*/
		//this.bubbles.forEachAlive(this.renderGroup, this);

	},

	renderGroup: function(member) {
		this.game.debug.body(member);
	},

	resetBullet: function(bullet) {
		//  Called if the bullet goes out of the screen
		bullet.kill();
	},

	restart: function() {

	}
};
