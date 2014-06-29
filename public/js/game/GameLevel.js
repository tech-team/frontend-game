define([
	'classy',
    'lodash',
    'signals',
    'easel',
    'collision',
    'game/StageManager',
    'game/ResourceManager',
    'game/DefaultObjects',
    'game/misc/KeyCoder',
    'game/misc/UntilTimer',
    'game/misc/Messenger',
    'game/entities/items/Items',
    'game/entities/Zombie',
    'game/entities/Chest',
    'game/entities/Door',
    'game/entities/Button',
    'game/entities/Bullet',
    'game/misc/Vector',
    'game/Overlay'
],
function(Class, _, signals, easeljs, collider, StageManager, ResourceManager, DefaultObjects, KeyCoder, UntilTimer, Messenger, Items, Zombie, Chest, Door, Button, Bullet, Vector, Overlay) {
    var GameLevel = StageManager.$extend({
		__init__: function(stage, levelData, player, resourceManager) {
            this.$super(stage, resourceManager);
            this.data = levelData;

            this.keyCoder = new KeyCoder();

            this.background = null;
            this.effects = {
                fog: null,
                damageEffect: null
            };

            this.player = player;

            this.walls = [];
            this.doors = [];
            this.chests = [];
            this.buttons = [];
            this.zombies = [];
            this.bullets = [];

            this.collisionObjects = [];
            this.ricochetObjects = [];
            this.drops = [];

//            /*** <Joystick stuff> ***/
//            this.isJoystick = false;
//            this.joystickServer = null;
//            this.lastShootTime = 0;
//            this.shootDelta = 350;
//            /*** </Joystick stuff> ***/

            this.finished = false;

            this.load(levelData);

            this.createEvents();
		},

        __classvars__: {
            Keys: {
                ToggleSound: KeyCoder.M,
                Use: KeyCoder.E,
                Shoot: KeyCoder.SPACE,
                Forward: KeyCoder.W,
                Back: KeyCoder.S,
                Left: KeyCoder.A,
                Right: KeyCoder.D,

                Weapon: {
                    knife: KeyCoder.ONE,
                    pistol: KeyCoder.TWO,
                    shotgun: KeyCoder.THREE
                },

                Hack: {
                    Finish: KeyCoder.X,
                    GearUp: KeyCoder.G
                }
            },

            SCORES: {
                KILL: 10,
                DOOR_OPEN: 5
            },

            SpeedModifier: {
                Normal: 0.75,
                Sprint: 1.5
            },

            CameraOffset: 200
        },

        createEvents: function() {
            this.levelFinished = new signals.Signal();

            var playerEvents = this.player.createEvents();
            playerEvents.healthChanged.add(this.overlay.setHealth.bind(this.overlay));
            playerEvents.armorChanged.add(this.overlay.setArmor.bind(this.overlay));
            playerEvents.ammoChanged.add(this.overlay.setAmmo.bind(this.overlay));
            playerEvents.weaponAdded.add(this.overlay.addWeapon.bind(this.overlay));
            playerEvents.weaponChanged.add(this.overlay.setWeapon.bind(this.overlay));
            playerEvents.weaponChanged.add(this.onWeaponChange.bind(this));
            playerEvents.itemAdded.add(this.overlay.addItem.bind(this.overlay));
            playerEvents.keyAdded.add(this.overlay.addKey.bind(this.overlay));
            playerEvents.scoreChanged.add(this.overlay.setScore.bind(this.overlay));


            var self = this;
            this.keyCoder.addEventListener("keyup", GameLevel.Keys.Use, function() {
                self.useHandle();
            });

            _.each(this.player.$class.getAvailableWeapons(), function(weapon) {
                self.keyCoder.addEventListener("keyup", GameLevel.Keys.Weapon[weapon], function() {
                    self.player.changeWeapon(weapon);
                });
            });

            this.keyCoder.addEventListener("keyup", GameLevel.Keys.ToggleSound, ResourceManager.toggleSound.bind(ResourceManager));
            this.keyCoder.addEventListener("keypress", GameLevel.Keys.Shoot, this.playerShootingHandle.bind(this));

            if (DEBUG) {
                this.keyCoder.addEventListener("keyup", GameLevel.Keys.Hack.Finish, this.finish.bind(this));

                this.keyCoder.addEventListener("keyup", GameLevel.Keys.Hack.GearUp, function () {
                    self.player.addWeapon("shotgun", 200);
                });

                this.keyCoder.addEventListener("keyup", KeyCoder.K, function () {
                    console.log(self.player.keys());
                });

                this.keyCoder.addEventListener("keyup", KeyCoder.I, function () {
                    console.log(self.player.inventory());
                });

                this.keyCoder.addEventListener("keyup", KeyCoder.O, function () {
                    console.log(self.player.weapons);
                });

                this.keyCoder.addEventListener("keyup", KeyCoder.F, function () {
                    self.effects.fogBox.visible = !self.effects.fogBox.visible;
                    self.effects.fog.visible = !self.effects.fog.visible;
                });
            }
        },

        load: function(data) {
            this.$super(data);

            var self = this;
            this.data = data;

            //add background
            this.background = this.addToStage(data, true);

            //add walls
            _.each(data.walls, function(obj) {
                self.walls.push(self.addToStage(obj));
            });

            //create empty containers for future stuff
            this.createContainer("corpse");
            this.createContainer("medkit");
            this.createContainer("weapon");
            this.createContainer("key");
            this.createContainer("bullet");

            //add doors
            _.each(data.doors, function(obj) {
                var door = new Door(self.addToStage(obj));
                self.doors.push(door);
            });

            //add chests
            _.each(data.chests, function(obj) {
                var chest = new Chest(self.addToStage(obj));
                self.chests.push(chest);
            });

            //add buttons
            _.each(data.buttons, function(obj) {
                var button = new Button(self.addToStage(obj), self.doors);
                self.buttons.push(button);
            });

            //add enemies
            _.each(data.zombies, function(obj) {
                var zombie = new Zombie(self.addToStage(obj));
                self.zombies.push(zombie);
            });

            //add waypoints
            for (var i = 0; i < self.zombies.length; ++i) {
                _.each(self.zombies[i].waypoints(), function(obj) {
                    self.addToStage(obj).visible = false;
                });
            }

            //add player
            data.player.tex = this.player.$class.weaponSpecificTex(this.player.currentWeapon);
            var playerObj = this.addToStage(data.player);

            this.player.setDispObj(playerObj);

            //add effects
            this.createContainer("effect", true);

            var graphics = new easeljs.Graphics();
            this.effects.fogBox = new easeljs.Shape(graphics);

            var fogBox = this.containers["effect"].addChild(this.effects.fogBox); // TODO: unused variable

            this.effects.fog = this.addToStage({
                type: "effect",
                tex: "effects/fog",
                x: this.player.x(),
                y: this.player.y()});



            this.effects.damage = this.addToStage({
                type: "effect",
                tex: "effects/damage",
                x: 0, y: 0,
                w: this.stage.canvas.width,
                h: this.stage.canvas.height}, true);
            this.effects.damage.visible = false;

            this.initOverlay();

            this.resize(); //recalculate overlay positions

            Messenger.showMessage(Messenger.levelLoaded, this.data.name);
            Messenger.showMessage(Messenger.levelStarted);

            this.updateFog(true);
            this.player.setEffects(this.effects);

            this.createCollisionObjects();
            this.createRicochetObjects();
            //ResourceManager.stopSounds();
        },

        initOverlay: function() {
            this.overlay = new Overlay(this.stage);
            //send old information from player to overlay
            _.each(_.keys(this.player.weapons), this.overlay.addWeapon.bind(this));
            this.overlay.setHealth(this.player.health());
            this.overlay.setArmor(this.player.armor());
            this.overlay.setWeapon(this.player.currentWeapon);
            this.overlay.setAmmo(this.player.ammo());
            this.overlay.setScore(this.player.score);
        },

        resize: function() {
            this.overlay.resize();

            this.updateEffects();

            //reset camera position
            this.mainContainer.x = 0;
            this.mainContainer.y = 0;
            this.updateCamera();
        },

        createCollisionObjects: function() {
            var self = this;

            _.each(this.walls, function(wall) {
                self.collisionObjects.push(wall);
            });

            _.each(this.zombies, function(zombie) {
                self.collisionObjects.push(zombie.dispObj);
            });

            _.each(this.doors, function(door) {
                if (door.isClosed()) {
                    self.collisionObjects.push(door.dispObj);
                }
            });

            _.each(this.chests, function(chest) {
                self.collisionObjects.push(chest.dispObj);
            });
        },

        createRicochetObjects: function() {
            var self = this;

            _.each(this.walls, function(wall) {
                self.ricochetObjects.push(wall);
            });

            _.each(this.doors, function(door) {
                if (door.isClosed()) {
                    self.ricochetObjects.push(door.dispObj);
                }
            });

            _.each(this.chests, function(chest) {
                self.ricochetObjects.push(chest.dispObj);
            });
        },

        onJoystickMessage: function(data, answer) {
            if (this.finished)
                return;

            if (data.type === "game") {
                switch (data.action) {
                    case "shoot":
                        if ('timestamp' in data && (this.lastShootTime === 0 || data.timestamp - this.lastShootTime > this.shootDelta)) {
                            this.lastShootTime = data.timestamp;
                            this.playerShootingHandle();
                        }
                        break;
                    case "weaponchange":
                        this.player.changeWeapon(data.weapon);
                        break;
                    case "move":
                        var speedModifier = (data.r === 0) ? (null) : (data.r === 1) ? (GameLevel.SpeedModifier.Normal) : (GameLevel.SpeedModifier.Sprint);
                        if (speedModifier) {
                            var movementData = {
                                speedModifier: speedModifier,
                                angle: data.phi
                            };
                            this.player.movementHandle(movementData, this.collisionObjects);
                        }
                        break;
                    case "use":
                        this.useHandle();
                        break;
                    default:
                        break;
                }
            }
        },

		update: function(event) {
            if (this.finished)
                return;

            if (this.checkBounds(this.player)) {
                this.player.restorePrevPos();
            }
            this.player.savePrevPos();

            _.each(this.bullets, function(bullet) {
                bullet.update(event);
            });
            this.bulletsCollisionsHandle();
            this.zombiesUpdate(event);
            this.zombiesDeathHandle();
            this.dropsHandle();
            this.player.update(event, this.collisionObjects);

            if (this.player.health() <= 0 && !this.player.dead) {
                this.player.dead = true;
                console.log("Game over.");
                ResourceManager.playSound(ResourceManager.soundList.GameOver);
                this.keyCoder.removeAllListeners();
                this.levelFinished.dispatch({
                    status: 'gameFinished',
                    score: this.player.score(),
                    message: "Game over"
                });
            }

            this.updateOverlay();
            this.updateFog();
            this.updateCamera();
            ResourceManager.updatePlayingSounds();
		},

        updateCamera: function() {
            var stageSize = {
                width: this.stage.canvas.width,
                height: this.stage.canvas.height
            };
            var offset = GameLevel.CameraOffset;

            if (this.player.x() > stageSize.width - offset) {
                this.mainContainer.x = -(this.player.x() - (stageSize.width - offset));
            }
            else if (this.player.x() < offset) {
                this.mainContainer.x = -this.player.x() + offset;
            }

            if (this.player.y() > stageSize.height - offset) {
                this.mainContainer.y = -(this.player.y() - (stageSize.height - offset));
            }
            else if (this.player.y() < offset) {
                this.mainContainer.y = -this.player.y() + offset;
            }
        },

        updateOverlay: function() {
            if (DEBUG)
                this.overlay.setFPS(easeljs.Ticker.getMeasuredFPS());
        },


        useHandle: function() {
            this.chestsOpeningHandle() ||
            this.buttonsPressingHandle() ||
            this.doorsOpeningHandle()
        },

        zombiesUpdate: function(event) {
            var self = this;

            _.each(this.zombies, function(zombie) {
                zombie.update(event, self.player, self.collisionObjects);
                if (zombie.justFired) {
                    if (zombie.isCurrentWeaponMelee()) {
                        var hit = zombie.shoot(self, self.player);
                        if (hit) {
                            ResourceManager.playSound(ResourceManager.soundList.PlayerHurt);
                        }
                    }
                    else {
                        zombie.shoot(self);
                        ResourceManager.playSound(ResourceManager.soundList.Weapons[zombie.currentWeapon].Fire);
                    }
                }
            });
        },

        onWeaponChange: function(name) {
            this.redrawGameObject(this.player);
            ResourceManager.playSound(ResourceManager.soundList.Weapons[name].Draw, ResourceManager.weaponData.drawCooldown);
        },

        playerShootingHandle: function() {
            if(this.player.shootCooldown == 0) {
                var currentWeapon = this.player.currentWeapon;

                if (this.player.hasCurrentAmmo()) {
                    var currentWeaponSounds = ResourceManager.soundList.Weapons[currentWeapon];

                    if (this.player.isCurrentWeaponMelee()) {
                        var hit = this.player.shoot(this, this.zombies);
                        ResourceManager.playSound((hit) ? (currentWeaponSounds.Hit) : (currentWeaponSounds.MissShort));
                    }
                    else {
                        this.player.shoot(this);
                        ResourceManager.playSound(currentWeaponSounds.Fire);
                    }

                    this.player.shootCooldown = this.player.weapons[this.player.currentWeapon].data.coolDown;
                }
                else if (this.player.messageCooldown <= 0) {
                    Messenger.showMessage(Messenger.outOfAmmo);
                    this.player.messageCooldown = 100;
                }
            }
        },

        bulletsCollisionsHandle: function() {
            var self = this;

            var i = 0;
            for (i = 0; i < this.bullets.length; ++i) {

                if (this.bullets[i].ttl !== null) {
                    if (this.bullets[i].ttl <= 0) {
                        this.removeFromStage(this.bullets[i].dispObj);
                        this.bullets.removeAt(i);
                        if (this.bullets.length > 0 && i > 0) --i;
                        else break;
                    } else {
                        --this.bullets[i].ttl;
                    }
                }
            }



            for (i = 0; i < this.bullets.length; ++i) {

                if (this.bullets[i].source == "player") {
                    _.each(this.zombies, function (zombie) {

                        if (self.bullets[i].collidesWith(zombie)) {
                            zombie.damage(self.bullets[i].power);
                            self.removeFromStage(self.bullets[i].dispObj);
                            self.bullets.removeAt(i);
                            if (self.bullets.length > 0 && i > 0) --i;

                            ResourceManager.playSound(ResourceManager.soundList.BulletHit);
                            return false; // bullet can damage only one zombie
                        }

                    });


                } else {
                    if (this.bullets[i].collidesWith(this.player)) {
                        this.player.damage(this.bullets[i].power);
                        this.removeFromStage(this.bullets[i].dispObj);
                        this.bullets.removeAt(i);
                        if (this.bullets.length > 0 && i > 0) --i;

                        ResourceManager.playSound(ResourceManager.soundList.BulletHit);
                        ResourceManager.playSound(ResourceManager.soundList.PlayerHurt);
                    }

                }
            }

            for (i = 0; i < this.bullets.length; ++i) {
                _.each(this.ricochetObjects, function (obj) {
                    if (self.bullets[i].collidesWith(obj)) {
                        self.removeFromStage(self.bullets[i].dispObj);
                        ResourceManager.playSound(ResourceManager.soundList.BulletRicochet);
                        self.bullets.removeAt(i);
                        if (self.bullets.length > 0 && i > 0) --i;
                        return false;
                    }
                });
            }

            for (i = 0; i < this.bullets.length; ++i) {
                if (this.checkBounds(this.bullets[i])) {
                    this.removeFromStage(this.bullets[i].dispObj);
                    this.bullets.removeAt(i);
                    if (this.bullets.length > 0 && i > 0) --i;
                }
            }
        },

        zombiesDeathHandle: function() {
            var self = this;

            for (var i = 0; i < this.zombies.length; ++i) {
                if (this.zombies[i].health <= 0) {
                    var corpse = DefaultObjects.build("corpse",
                        {
                            tex: "zombie_corpse",
                            x: this.zombies[i].x(),
                            y: this.zombies[i].y(),
                            r: this.zombies[i].rotation()
                        });

                    this.addToStage(corpse);
                    this.removeFromStage(this.zombies[i].dispObj);

                    for (var j = 0; j < this.collisionObjects.length; ++j) {
                        if (this.collisionObjects[j] == this.zombies[i].dispObj) {
                            this.collisionObjects.splice(j, 1);
                        }
                    }

                    this.zombies[i].drops().forEach(function(dropped) {
                        dropped.x = self.zombies[i].x();
                        dropped.y = self.zombies[i].y();

                        var drop = DefaultObjects.build(dropped.type, dropped);
                        self.drops.push(self.addToStage(drop))
                    });

                    this.zombies.splice(i, 1);
                    this.player.addScore(GameLevel.SCORES.KILL);
                }
            }
        },

        itemInteraction: function(item, disableSounds) {
            var itemObject = new Items[item.type](item);

            itemObject.apply(this.player);

            if (!disableSounds)
                ResourceManager.playSound(ResourceManager.soundList.Items[itemObject.type()]);
        },

        pickNearestToPlayer: function(targets, reachablePredicate) {
            var self = this;

            var nearest = null;
            _.each(targets, function(target) {
                var d = self.getDistance(target);

                if (reachablePredicate(d, target) && (!nearest || d < nearest)) {
                    nearest = target;
                }
            });

            return nearest;
        },

        chestsOpeningHandle: function(event) {
            var nearestChest = this.pickNearestToPlayer(this.chests, function(d) {
                return d <= this.player.$class.Reach && d <= Chest.ActivationRadius;
            }.bind(this));

            if (nearestChest) {
                nearestChest.update(event, this.player);

                if (nearestChest.isClosed()) {
                    Messenger.showMessage(Messenger.chestLocked, nearestChest.requiresMessage);
                }
                else {
                    ResourceManager.playSound(ResourceManager.soundList.ChestOpen);

                    _.each(nearestChest.storage(), this.itemInteraction.bind(this));

                    nearestChest.clearStorage();
                    this.redrawGameObject(nearestChest);

                    this.chests.remove(nearestChest);
                }
                return true;
            }
            return false;
        },


        dropsHandle: function() {
            var self = this;

            var newDrops = _.clone(this.drops);

            _.each(this.drops, function(drop, i) {
                if (self.checkReach(drop)) {
                    if (collider.checkPixelCollision(drop, self.player.dispObj)) {
                        self.itemInteraction(drop.data);

                        self.removeFromStage(drop);
                        newDrops.removeAt(i);
                    }
                }
            });

            this.drops = newDrops;
        },

        doorsOpeningHandle: function(event, targetDoors) {
            var self = this;

            var removeDoors = false;

            var doorUpdater = function(door) {
                if (door && door.isClosed()) {
                    door.update(event, self.player, self.zombies.length);

                    if (door.isClosed()) {
                        Messenger.showMessage(door.requiresMessage);
                        ResourceManager.playSound(ResourceManager.soundList.DoorLocked);
                    }
                    else {
                        ResourceManager.playSound(ResourceManager.soundList.DoorOpen);

                        self.collisionObjects.remove(door.dispObj);
                        self.redrawGameObject(door);
                        removeDoors = true;

                        self.player.addScore(GameLevel.SCORES.DOOR_OPEN);

                        if (door.role() == "exit") {
                            self.finish();
                        }
                    }
                }
            };

            if (targetDoors) {
                _.each(targetDoors, doorUpdater.bind(this));

                if (removeDoors) {
                    _.each(targetDoors, function (door) {
                        self.doors.remove(door);
                    });
                }
            } else {
                var door = this.pickNearestToPlayer(this.doors, function (d) {
                    return d <= Door.ActivationRadius;
                });
                doorUpdater(door);

                if (removeDoors) {
                    this.doors.remove(door);
                }
            }
        },

        // TODO: make puzzle a separate object in level
        buttonsPressingHandle: function(event) {
            var self = this;

            var button = this.pickNearestToPlayer(this.buttons, function(d, button) {
                return d <= Button.ActivationRadius && button.isReleased();
            });

            if (button) {
                var solved = button.update(event);
                self.redrawGameObject(button);
                ResourceManager.playSound(ResourceManager.soundList.Click);

                if (solved !== null) {

                    if (solved) {
                        Messenger.showMessage(Messenger.puzzleSolved);
                        this.doorsOpeningHandle(event, button.targets());
                    } else {
                        Messenger.showMessage(Messenger.puzzleFailed);
                    }

                }

                if (button.isPressed()) {
                    setTimeout(function () {
                        button.releaseButton();
                        ResourceManager.playSound(ResourceManager.soundList.Click);
                        self.redrawGameObject(button);
                    }, 1500);
                }
            }
        },

        redrawGameObject: function(gameObject) {
            this.removeFromStage(gameObject.dispObj);
            gameObject.setDispObj(this.addToStage(gameObject.data()));
        },

        getDistance: function(obj) {
            var toObject = null;
            if (_.isFunction(obj.x) && _.isFunction(obj.y)) {
                toObject = new Vector({
                    x: this.player.x() - obj.x(),
                    y: this.player.y() - obj.y()
                });
            } else {
                toObject = new Vector({
                    x: this.player.x() - obj.x,
                    y: this.player.y() - obj.y
                });
            }

            return toObject.distance();
        },

        checkReach: function(obj) {
            return this.getDistance(obj) <= this.player.$class.Reach;
        },

        checkBounds: function(obj) {
            // TODO:  впрочем это не учитывает.. ничего не учитывает
            // TODO:  (поворот, форму)
            return obj.x() + obj.dispObj.getBounds().width/2 >= this.data.w ||
                   obj.x() - obj.dispObj.getBounds().width/2 <= 0 ||
                   obj.y() + obj.dispObj.getBounds().height/2 >= this.data.h ||
                   obj.y() - obj.dispObj.getBounds().height/2 <= 0;
        },

        updateEffects: function() {
            this.updateFog(true);

            this.removeFromStage(this.effects.damage);
            this.effects.damage = this.addToStage({
                type: "effect",
                tex: "effects/damage",
                x: 0, y: 0,
                w: this.stage.canvas.width,
                h: this.stage.canvas.height}, true);
            this.effects.damage.visible = false;
        },

        updateFog: function(forceUpdate) {
            if (this.effects.fog) {
                var playerPos = {
                    x: Math.floor(this.player.x() + this.mainContainer.x),
                    y: Math.floor(this.player.y() + this.mainContainer.y)
                };

                //if player moved
                if (this.effects.fog.x != playerPos.x
                    || this.effects.fog.y != playerPos.y
                    || forceUpdate) {

                    var fogBox = this.effects.fogBox.graphics;

                    var frameSize = 380;
                    var stageSize = {
                        width: this.stage.canvas.width,
                        height: this.stage.canvas.height
                    };

                    fogBox.clear();
                    fogBox.beginFill("#000");

                    fogBox.rect(
                        0,
                        0,
                        stageSize.width,
                        playerPos.y - frameSize/2
                    ); //top

                    fogBox.rect(
                        0,
                        0,
                        playerPos.x - frameSize/2,
                        stageSize.height
                    ); //left

                    fogBox.rect(
                        0,
                        playerPos.y + frameSize/2,
                        stageSize.width,
                        stageSize.height - playerPos.y - frameSize/2
                    ); //bottom

                    fogBox.rect(
                        playerPos.x + frameSize/2,
                        0,
                        stageSize.width - playerPos.x + frameSize/2,
                        stageSize.height
                    ); //right

                    this.effects.fog.x = playerPos.x;
                    this.effects.fog.y = playerPos.y;
                }
            }
        },

        finish: function() {
            if (!this.finished) {
                this.finished = true;
                this.keyCoder.removeAllListeners();

                var finishTimeout = 7000;

                ResourceManager.playSound(ResourceManager.soundList.LevelFinished);
                Messenger.showMessage(Messenger.levelFinished);

                var self = this;
                new UntilTimer(finishTimeout, function() {
                        self.stage.alpha = 1 - this.elapsed / finishTimeout;
                    },
                    function() {
                        self.levelFinished.dispatch({});
                        self.stage.alpha = 1;
                    });
            }
        }
	});

	return GameLevel;
});