define([
    'classy'
],
    function(Class) {

        var LevelManager = Class.$extend({
            __init__: function() {

            },

            getLevel: function(id) {
                //TODO: should load from server via AJAX

                return {
                    width: 10,
                    height: 10,

                    textures: [
                        "res/gfx/tiles/road.png",
                        "res/gfx/tiles/wall.png",
                    ],

                    cells: [
                        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                    ],

                    objects: [
                        {id: 1, x: 10, y: 20, angle: 30}
                    ],

                    wayPoints: [
                        {x: 11, y: 12}
                    ]
                }
            }
        });

        return LevelManager;
    })