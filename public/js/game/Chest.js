define([
    'classy',
    'game/GameObject'
],
    function(Class, GameObject) {
        var Chest = GameObject.$extend({
            __init__: function(obj) {
                this.storage = obj.storage;
                this.state = ( obj.state === "open" ) ? Chest.State.Open : Chest.State.Closed ;
            },

            __classvars__: {
                State: {
                    Closed: 0,
                    Open: 1
                }
            },

            update: function(event) {

            }
        });

        return Chest;
    });