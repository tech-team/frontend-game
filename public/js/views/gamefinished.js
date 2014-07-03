define([
    'backbone',
    'tmpl/gamefinished',
    'collections/scores',
    'models/player',
    'views/viewmanager'
], 
function(Backbone, tmpl, Scoreboard, Player, ViewManager) {

    var GameFinishedView = Backbone.View.extend({
        template: tmpl,
        tagName: 'section',
        className: 'page',
        pageId: '#gameFinishedPage',
        hidden: true,

        dimmer: null,
        senderForm: null,
        userField: null,
        scoreField: null,
        sendSubmit: null,
        $loader: null,
        errorField: null,

        initialize: function () {
            ViewManager.addView(this);
        },

        render: function (scoreValue, message) {
            scoreValue = scoreValue ? scoreValue : 0;
            message = message ? message : "You Loose";

            this.$el.html(this.template({score: scoreValue, message: message}));
            this.$el.attr('id', this.pageId.slice(1));

            this.dimmer = this.$el.find('.score-sender-dimmer');
            this.senderForm = this.$el.find('#scoreForm');
            this.userField = this.$el.find('input#user');
            this.scoreField = this.$el.find('input#score');
            this.sendSubmit = this.$el.find('input#sendSubmit');
            this.$loader = this.$el.find('.score-content__loading-indicator');
            this.errorField = this.$el.find('.error_message');

            this.bindEvents();
            return this;
        },

        bindEvents: function() {
            var self = this;

            this.dimmer.click(function() {
                self.hide();
                ViewManager.show(ViewManager.views['#scoreboard'], true);
            });

            this.senderForm.submit(function(event) {
                event.preventDefault();

                var data = {};
                $.each(self.senderForm.serializeArray(), function (i, input) {
                    data[input.name] = input.value;
                });
                data['name'] = data['name'].trim();
                if (data['name'] === '') {
                    self.errorField.text("Name cannot be empty");
                    self.errorField.show();
                    return;
                }

                if (data['save'] && data['save'] == 1) {
                    delete data['save'];
                    Scoreboard.saveLocally(data);

                    self.hide();
                    window.location = '#scoreboard';
                    return;
                }

                Scoreboard.sendScore(data, {
                    before: function() {
                        self.blockForm();
                    },
                    success: function(event) {
                        self.unblockForm();
                        self.hide();

                        window.location = '#scoreboard';
                    },
                    fail: function(event) {
                        self.unblockForm();
                        self.reconfigureSendToSave();

                        self.errorField.text(event.message);
                        self.errorField.show();
                    }
                });

            });
        },

        show: function (scoreValue, message) {
            this.render(scoreValue, message);
            this.$el.show();
            ViewManager.addToDOM(this.pageId);

            this.hidden = false;
        },

        hide: function () {
            if (!this.hidden) {
                this.$el.hide();
                this.remove();
                this.hidden = true;
            }
        },

        blockForm: function() {
            this.userField.prop('disabled', true);
            this.sendSubmit.prop('disabled', true);
            this.$loader.show();
        },

        unblockForm: function() {
            this.userField.prop('disabled', false);
            this.sendSubmit.prop('disabled', false);
            this.$loader.hide();
        },

        reconfigureSendToSave: function() {
            this.sendSubmit.css({
                'background-color': '#05C925'
            });
            var content = this.$el.find('.score-content-wrapper');
            content.css({
                'height': 240 + 'px'
            });
            this.sendSubmit.prop('value', 'Save');

            var saveFlagInput = $('<input type="hidden" value="1" name="save"/>');
            this.senderForm.append(saveFlagInput);
        }

    });

    return new GameFinishedView();
});