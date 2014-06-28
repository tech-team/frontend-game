define([
    'classy'
], function(Class) {
    var Weapon = Class.$extend({
        __init__: function(ammo, data, melee) {
            this.ammo = ammo || null;
            this.data = data;
            this.melee = melee;
        },

        addAmmo: function(ammo) {
            if (this.ammo)
                this.ammo += ammo;
        },

        getAmmo: function() {
            return {
                current: this.ammo,
                total: 0//this.totalAmmo //actually the rest of ammo
            };
        },

        hasAmmo: function() {
            return this.ammo === null || this.ammo > 0;
        },

        shoot: function(level) {
            throw "Pure weapon. Not available";
        }
    });

    return Weapon;
});