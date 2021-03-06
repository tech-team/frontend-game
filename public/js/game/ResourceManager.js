define([
	'classy',
    'lodash',
    'easel',
    'preload',
    'sound',
    'alertify',
    'game/misc/ImageTiler',
    'utils/LocalStorage'
],
function(Class, _, createjs, preloadjs, soundjs, alertify, ImageTiler, LocalStorage) {
    //TODO: недосинглтон какой-то получился...
	var ResourceManager = Class.$extend({
        __classvars__: {
            //all textures should have .png format
            texList: ["ground", "zombie", "zombie-pistol", "player-knife", "player-pistol", "player-shotgun", "wall", "brick_wall1", "brick_wall2",
                "brick_wall3", "brick_wall4", "brick_wall_endless", "chest", "chest-open", "door-open", "door-closed", "door-exit", "button", "button_pressed",
                "rubbish", "waypoint", "pistol", "pistol-bullet", "shotgun", "shotgun-bullet", "golden-key", "silver-key",
                "effects/fog", "effects/damage", "effects/poison", "zombie_corpse", "golden_apple", "glow", "overlay/OverlayBar", "armor", "puzzle"],
            soundList: {
                Click: "click.mp3",
                BulletHit: "bullet_hit.mp3",
                ZombieHurt: "ambiance.mp3",
                PlayerHurt: ["hurt1.mp3", "hurt2.mp3", "hurt3.mp3"],
                ArmorHit: "armorHit.mp3",
                BulletRicochet: "ricochet.mp3",
                DoorOpen: "door_open.mp3",
                DoorLocked: ["doorLocked1.mp3", "doorLocked2.wav"],
                ChestOpen: "chest_open.mp3",
                GameOver: "game_over.mp3",
                Victory: "fortunate_son.mp3",
                LevelFinished: "levelFinished.mp3",

                Items: {
                    weapon: "ammo.mp3",
                    ammo: "ammo.mp3",
                    medkit: "apple.mp3",
                    armor: ["armor1.mp3", "armor2.mp3", "armor3.mp3"],
                    key: ["keyPicked1.wav", "keyPicked2.wav"],
                    inventoryItem: ["itemPicked1.wav", "itemPicked2.wav", "itemPicked3.wav", "itemPicked4.wav"]
                },

                Weapons: {
                    knife: {
                        Draw: "knife.mp3",
                        Miss: "knife_miss_short.mp3",
                        Hit: "knife_stab.mp3"
                    },
                    pistol: {
                        Draw: "pistol_draw.mp3",
                        Fire: "pistol_shoot.mp3",
                        OutOfAmmo: "outOfAmmo.wav"
                    },
                    shotgun: {
                        Draw: "shotgun_draw.mp3",
                        Fire: "shotgun_shoot.mp3",
                        OutOfAmmo: "outOfAmmo.wav"
                    }
                }
            },
            weaponData: {
                fist: {
                    power: 3
                },
                knife: {
                    power: 5,
                    coolDown: 15
                },
                pistol: {
                    power: 10,
                    coolDown: 20
                },
                shotgun: {
                    power: 20,
                    coolDown: 40,
                    bulletNum: 5,
                    dispersion: 10,
                    ttl: 20
                },
                drawCooldown: 25
            },
            playingSounds: {},

            ResourceType: {
                sound: 0,
                tex: 1
            },

            instance: null,

            load: function(onComplete) {
                if (this.instance && this.instance.loaded)
                    onComplete();
                else if (!this.instance)
                    this.instance = new ResourceManager(onComplete);
                else
                    this.instance.setOnComplete(onComplete);

                return this.instance;
            },

            getInstance: function() {
                return this.instance;
            },

            soundDisabled: LocalStorage.getJSON("soundDisabled"),

            toggleSound: function() {
                this.soundDisabled = !this.soundDisabled;
                LocalStorage.setJSON("soundDisabled", this.soundDisabled);

                alertify.success(this.soundDisabled ? "Sound disabled" : "Sound enabled");
            },

            playSound: function(snd, cooldown) {
                if (_.isUndefined(snd))
                    throw "playSound: snd is undefined";

                if (this.soundDisabled)
                    return;

                var sound = snd;
                if (_.isArray(sound)) {
                    var randId = _.random(0, sound.length - 1);
                    sound = sound[randId];
                }

                if (!(sound in ResourceManager.playingSounds) || (ResourceManager.playingSounds[sound] === 0)) {
                    soundjs.Sound.play(sound);
                    ResourceManager.playingSounds[sound] = cooldown || 0;
                }
            },

            stopSounds: function() {
                soundjs.Sound.stop();
            },

            updatePlayingSounds: function() {
                for (var sound in ResourceManager.playingSounds) {
                    if(ResourceManager.playingSounds.hasOwnProperty(sound)) {
                        if (ResourceManager.playingSounds[sound] > 0) {
                            --ResourceManager.playingSounds[sound];
                        }
                    }
                }
            }
        },

		__init__: function(onComplete) {
            this.loaded = false;
            this.onComplete = onComplete;

            this.images = [];
            this.spriteSheets = [];

            var self = this;

            var $progressBarDiv = $('.game-load-progress');
            var $progressBar = $('.game-load-progress__wrapper__progress');
            var $progressBarLabel = $('.game-load-progress__wrapper__progress-value');

            var queue = new preloadjs.LoadQueue();
            queue.installPlugin(soundjs.Sound);
            queue.on("complete", handleComplete, this);
            queue.on("progress", handleProgress, this);

            var manifest = [];
            _.each(ResourceManager.texList, function(tex) {
                manifest.push({
                    id: tex,
                    src: "gfx/large/" + tex + ".png",
                    resType: ResourceManager.ResourceType.tex
                });
            });

            _.each(flattenObject(ResourceManager.soundList), function(sound) {
                if (sound && sound != "") {

                    if (_.isArray(sound)) {
                        _.each(sound, function(snd) {
                            manifest.push({
                                id: snd,
                                src: "sound/" + snd,
                                resType: ResourceManager.ResourceType.sound
                            });
                        });
                    }
                    else {
                        manifest.push({
                            id: sound,
                            src: "sound/" + sound,
                            resType: ResourceManager.ResourceType.sound
                        });
                    }
                }
            });

            queue.loadManifest(manifest, true, "res/");

            function handleComplete() {
                _.each(manifest, function(res) {
                    if (res.resType === ResourceManager.ResourceType.tex)
                        self.images[res.id] = queue.getResult(res.id);
                });
                self.onComplete();

                self.loaded = true;

                //hide progressBar
                $progressBarDiv.hide();
                //show game canvas
                $('#game-field').show();
                $('#editor-field').show();
            }

            function handleProgress(event) {
                var val = Math.floor(event.progress*100);
                $progressBar.val(val);
                $progressBarLabel.text(val + '%');
            }
		},

        setOnComplete: function(onComplete) {
            this.onComplete = onComplete;
        },

        getSpriteSheet: function(tex) {
            var spriteSheet = this.spriteSheets[tex];

            if (!spriteSheet) { //if not cached
                var image = this.images[tex];

                if (_.isUndefined(image))
                    throw "No such texture: " + tex;

                var data = {
                    images: [image],
                    frames: {
                        width: image.width,
                        height: image.height
                    }
                };

                this.spriteSheets[tex] = spriteSheet = new createjs.SpriteSheet(data);
            }

            return spriteSheet;
        },

        getTiledSpriteSheet: function(tex, desiredWidth, desiredHeight) {
            var image = this.images[tex];

            //if desired sizes specified differs from actual image's size
            if (desiredWidth && desiredHeight
                && desiredWidth != "" && desiredHeight != "" //default editor values
                && (image.width != desiredWidth || image.height != desiredHeight)) {
                var tiledImage =
                    ImageTiler(image,
                        desiredWidth/image.width,
                        desiredHeight/image.height);

                if (_.isUndefined(image))
                    throw "No such texture: " + tex;

                var data = {
                    images: [tiledImage],
                    frames: {
                        width: desiredWidth,
                        height: desiredHeight
                    }
                };

                return new createjs.SpriteSheet(data);
            }
            else
                return this.getSpriteSheet(tex);
        }
	});

	return ResourceManager;
});