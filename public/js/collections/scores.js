define([
    'backbone',
    'models/player',
    'collections/LocalStorage'
], 
function(Backbone, Player, LocalStorage) {
    var ScoreBoard = Backbone.Collection.extend({
    	model: Player,
        localStorageScoreKey: "scores",

    	initialize: function() {

    	},

        sendScore: function(score_data, callbacks) {
            var without_echoing = !callbacks;

            var self = this;
            $.ajax({
                    type: 'POST',
                    url: 'scores',
                    data: score_data,
                    dataType: 'json',
                    beforeSend: function() {
                        if (!without_echoing) {
                            callbacks.before();
                        }
                    },
                    success: function(data) {
                        if (!without_echoing) {
                            callbacks.success(data);
                        }
                        self.add(new Player(score_data));
                    },
                    error: function(data) {
                        LocalStorage.addToArray(self.localStorageScoreKey, score_data);
                        if (!without_echoing) {
                            callbacks.fail({
                                data: data,
                                message: "Connection Failed. Score saved locally."
                            })
                        }
                    }
            });
        },

        retrieve: function(limitCount, callbacks) {
            var self = this;

            $.ajax({
                    type: 'GET',
                    url: 'scores',
                    data: {
                        limit: limitCount
                    },
                    dataType: 'json',
                    beforeSend: function() {
                        callbacks.before();

                        var savedScores = LocalStorage.getJSON(self.localStorageScoreKey);
                        if (savedScores) {
                            console.log("There are scores saved locally. Attempt to send them to the server.");
                            _.each(savedScores,
                                function(elem, i) {
                                    LocalStorage.popFromArray(self.localStorageScoreKey);
                                    self.sendScore(elem, null);
                                });
                        }

                    },
                    success: function(data) {
                        self.models = [];
                        for (var i = 0; i < data.length; ++i) {
                            self.models.push(new Player(data[i]));
                        }

                        callbacks.success(data);
                    },
                    error: function(data) {
                        callbacks.fail({
                            data: data,
                            message: "Connection Error. Try again later."
                        });
                    }
                });
        },

        comparator: function(a, b) {
            a = a.get(this.sort_key);
            b = b.get(this.sort_key);
            return a > b ?  1
                 : a < b ? -1
                 :          0;
        },

        reverseComparator: function(a, b) {
            a = a.get(this.sort_key);
            b = b.get(this.sort_key);
            return a > b ? -1
                 : a < b ? 1
                 :          0;
        },

        sortByScore: function(ascending) {
            if (!ascending)
                this.comparator = this.reverseComparator;
            this.sort_key = "score";
            this.sort();
        }
    });

    return new ScoreBoard();
});