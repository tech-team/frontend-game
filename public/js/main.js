require.config({
    urlArgs: "_=" + (new Date()).getTime(),
    baseUrl: "js",
    paths: {
        jquery: "lib/jquery",
        underscore: "lib/underscore",
        backbone: "lib/backbone",
        classy: "lib/classy",
        easel: "lib/game/easeljs",
        preload: "lib/game/preloadjs",
        sound: "lib/game/soundjs",
        tween: "lib/game/tweenjs",
    },
    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'underscore': {
            exports: '_'
        },
        'classy': {
            exports: 'Class'
        },
        'easel': {
            exports: 'createjs'
        },
        'preload': {
            deps: ['easel'],
            exports: 'preloadjs'
        },
        'sound': {
            exports: 'soundjs'
        },
        'tween': {
            deps: ['easel'],
            exports: 'tweenjs'
        }
    }
});

define([
    'backbone',
    'router'
], function(Backbone, router) {
    Backbone.history.start();

});
