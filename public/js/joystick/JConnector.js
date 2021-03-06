define([
    'lodash',
    'classy',
    'Connector',
    'utils/LocalStorage'
], function(_, Class, Connector, LocalStorage) {
    var JConnector = Class.$extend({
        __init__: function($tokenForm, $inputField, callbacks) {
            this.$tokenForm = $tokenForm;
            this.$inputField = $inputField;
            this.callbacksArray = [];
            this.addCallbacks(callbacks);

            // Создаем связь с сервером
            this.server = new Connector({
                    server: ['bind', 'unbind'],
                    remote: '/player'
                }
            );

            this.createServerEvents();
            this.init();
            window.server = this.server;
            this.ready = false;
        },

        _getPlayerGuid: function() {
            return LocalStorage.get(LocalStorage.$keys.J.Player);
        },

        _setPlayerGuid: function(guid) {
            LocalStorage.set(LocalStorage.$keys.J.Player, guid);
        },

        _removePlayerGuid: function() {
            LocalStorage.unset(LocalStorage.$keys.J.Player);
        },

        applyCallback: function(name) {
            var self = this;
            var args = Array.prototype.slice.call(arguments, 1);

            _.each(this.callbacksArray, function(callbacks) {
                callbacks[name] && callbacks[name].apply(self, args);
            });
        },

        addCallbacks: function(callbacks) {
            callbacks || (callbacks = {});
            callbacks.onStart || (callbacks.onStart = function() {});
            callbacks.onMessage || (callbacks.onMessage = function(data, answer) {});
            callbacks.onStatusChanged || (callbacks.onStatusChanged = function(status) {});
            callbacks.onDisconnect || (callbacks.onDisconnect = function() {});
            callbacks.onWrongToken || (callbacks.onWrongToken = function() {});
            callbacks.onForceReconnect || (callbacks.onForceReconnect = function(noNotification) {});

            this.callbacksArray.push(callbacks);
        },

        createServerEvents: function() {
            this.server.on('connect', function() {
                this.ready = true;
                this.applyCallback('onStatusChanged', 'ready');
            }.bind(this));
            this.server.on('reconnect', this.reconnect.bind(this));
            this.server.on('forceReconnect', this.forceReconnect.bind(this));

            var self = this;
            // Обмен сообщениями
            this.server.on('message', function (data, answer) {
                if (data.type == '__forceReconnect__') {
                    self.forceReconnect(true);
                    answer && answer()
                } else {
                    self.applyCallback('onMessage', data, answer);
                }
            });

            this.server.on('disconnect', function() {
                self._removePlayerGuid();
                window.server = null;
                self.applyCallback('onDisconnect');
            });
        },

        // Инициализация
        init: function () {
            if (this.ready) {
                this.applyCallback('onStatusChanged', 'ready');
            } else {
                this.applyCallback('onStatusChanged', 'server is not available');
            }

            // Если id нет
            if (!this._getPlayerGuid()) {
                // Ждем ввода токена
                var self = this;
                this.$tokenForm.off('submit');
                this.$tokenForm.submit(function (e) {
                    e.preventDefault();

                    // И отправляем его на сервер
                    self.server.bind({token: self.$inputField.val().toLowerCase()}, function (data) {
                        if (data.status == 'success') { //  В случае успеха
                            // Стартуем джостик
                            self.start(data.guid);
                        } else {
                            self.applyCallback('onWrongToken');
                        }
                    });
                });

            } else { // иначе
                // переподключаемся к уже созданной связке
                this.reconnect();
            }
        },

        forceReconnect: function(theirAttempt) {
            var guid = this._getPlayerGuid();
            this._removePlayerGuid();
            this.applyCallback('onForceReconnect', theirAttempt);
            if (!theirAttempt) {
                var self = this;
                self.server.send({
                    type: '__forceReconnect__'
                }, function() {
                    self.server.unbind({guid: guid}, function(data) {
                        if (data.status == 'success') {
                            console.log('onReconnecting unbind success: ');
                            self.init();
                        } else {
                            console.warn('onReconnecting error: ' + data.status);
                        }
                    });
                });
            } else {
                this.init();
            }
        },

        // Переподключение
        // Используем сохранненный id связки
        reconnect: function (guid) {
            var self = this;

            guid || (guid = this._getPlayerGuid());

            this.server.bind({guid: guid}, function (data) {
                // Если все ок
                if (data.status == 'success') {
                    // Стартуем
                    self.start(data.guid);
                    // Если связки уже нет
                } else if (data.status == 'undefined guid') {
                    // Начинаем все заново
                    self._removePlayerGuid();
                    self.init();
                }
            });
        },

        start: function(guid) {
            console.log('start player');
            // Сохраняем id связки
            this._setPlayerGuid(guid);
            this.applyCallback('onStatusChanged', 'game');
            this.applyCallback('onStart');
        }
    });

    return JConnector;
});