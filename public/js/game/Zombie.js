define([
    'classy',
    'game/AliveObject',
    'collision'
],
    function(Class, AliveObject, ndgmr) {
        var Zombie = AliveObject.$extend({
            __init__: function(obj) {
                this.waypoints = obj.waypoints;
                this.target = obj.waypoints[0];
                this.speed = obj.speed;
                this.currentWaypoint = 0;
                this.canAttack = true;
                this.attackInterval = 1000;
                this.damage = 5;
                this.followDistance = 150;
                this.attackDistnance = 20;
            },

            update: function(event, player) {

                var epsilon = 5;

                // not yet needed
                // var distancesToWaypoints = [];
                // distancesToWaypoints.push ({
                //     x: (this.waypoints[0].y - this.dispObj.y) / (Math.tan((this.waypoints[0].y - this.dispObj.y) /
                //                                                           this.dispObj.x - this.waypoints[0].x))
                // });

                var vectorsToWaypoint = {
                    x: this.target.x - this.dispObj.x,
                    y: this.target.y - this.dispObj.y
                };

                var vectorToPlayer = {
                    x: player.dispObj.x - this.dispObj.x,
                    y: player.dispObj.y - this.dispObj.y,
                    distance: function() { return Math.sqrt(this.x*this.x + this.y*this.y); }
                };

                var angle = Math.atan2(vectorsToWaypoint.y,
                                       vectorsToWaypoint.x);

                this.dispObj.rotation = (180 / Math.PI) * angle;

                if (vectorToPlayer.distance() < this.followDistance) {
                    this.target = player.dispObj;
                    if (this.canAttack && vectorToPlayer.distance() < this.attackDistnance) {
                        player.damage(this.damage);
                        this.canAttack = false;
                        var self = this;

                        setTimeout(function() {
                            self.canAttack = true;
                        }, this.attackInterval);
                    }
                }
                else {
                    this.target = this.waypoints[this.currentWaypoint];
                }

                if (vectorsToWaypoint.x != 0) {
                    this.dispObj.x += this.speed * Math.cos(angle);
                }
                if (vectorsToWaypoint.y != 0) {
                    this.dispObj.y += this.speed * Math.sin(angle);
                }

                if (Math.abs(vectorsToWaypoint.x) < epsilon &&
                    Math.abs(vectorsToWaypoint.y) < epsilon &&
                    this.target != player.dispObj)
                {
                    if (++this.currentWaypoint < this.waypoints.length) {
                        this.target = this.waypoints[this.currentWaypoint];
                    }
                    else {
                        this.currentWaypoint = 0;
                        this.target = this.waypoints[this.currentWaypoint];
                    }
                }



            }
        });

        return Zombie;
    });