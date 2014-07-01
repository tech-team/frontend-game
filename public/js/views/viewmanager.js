define([
    'backbone'
], 
function(Backbone) {
    var ViewManager = Backbone.View.extend({
        el: '#pages',
        views: {},
        currentView: null,
        router: null,

        initialize: function () {
            var self = this;
//            $(document).on("showPageEvent", function(event) {
//                _.each(self.views, function(value, key) {
//                    if (event.pageId !== key) {
//                        value.hide();
//                    }
//                });
//            });
        },

        addView: function(view) {
            this.views[view.pageId] = view;
            this.addToDOM(view.pageId);
        },

        addToDOM: function(viewId) {
            this.$el.append(this.views[viewId].$el);
        },

        _setCurrentViewActive: function(viewToShow) {
            this.currentView = viewToShow;
            this.currentView.show();
        },

        _closeOthers: function(currentId) {
            _.each(this.views, function(value, key) {
                if (currentId !== key) {
                    value.hide();
                }
            });
        },

        setRouter: function(router) {
            this.router = router;
        },

        show: function(viewToShow) {
            if (!this.currentView) {
                this._setCurrentViewActive(viewToShow);
                return;
            }

            var self = this;
            this.currentView.confirm({
                yes: function() {
                    self._closeOthers(viewToShow.pageId);
                    self._setCurrentViewActive(viewToShow);
                },
                no: function() {
                    self.router.navigate(self.currentView.pageId);
                }
            });

        }

    });

    return new ViewManager();
});