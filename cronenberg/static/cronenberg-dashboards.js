cronenberg.DashboardHolder = function(url) {
    this.url = url,
    this.dashboard = null
};

cronenberg.DashboardManager = function() {
    this.current = null,

    /**
     * Register an event handler for processing a dashboard once it's
     * loaded and ready.
     */
    this.onDashboardLoaded = function(handler) {
        bean.on(cronenberg.dashboards, cronenberg.events.DASHBOARD_LOADED, handler);
        return this;
    };

    this.load = function(url) {
        this.current = new cronenberg.DashboardHolder(url);
        var current = this.current;
        $.ajax({
            dataType: "json",
            url: url
        }).done(function(data) {
            var dashboard = data.entities[0];
            current.dashboard = dashboard;

            // Build a map from the presentation elements to their
            // model objects.
            dashboard.elementToItemMap = {};
            _.each(dashboard.grid.rows, function(row) {
                if (row.item_type == 'row') {
                    _.each(row.cells, function(cell) {
                        _.each(cell.presentation, function(presentation) {
                            if (typeof(presentation.element_id) != "undefined") {
                                dashboard.elementToItemMap[presentation.element_id] = presentation;
                            }
                        });
                    });
                }
            });

            // Set up the queries
            cronenberg.queries.clear();
            for (var query_name in dashboard.queries) {
                cronenberg.queries.add(query_name, dashboard.queries[query_name]);
            }
            bean.fire(cronenberg.dashboards, cronenberg.events.DASHBOARD_LOADED, dashboard);
        });
    };

    this.refresh = function() {
        if (this.current) {
            this.load(this.current.url);
        }
    };

    this.autoRefreshInterval = null;
    this.intervalId = null;

    this.autoRefresh = function(intervalSeconds) {
        var self = this;
        self.autoRefreshInterval = intervalSeconds;
        if ((!intervalSeconds || intervalSeconds == 0) && self.intervalId) {
            window.clearInterval(self.intervalId);
        } else if (intervalSeconds > 0 && !self.timeoutId) {
            self.intervalSeconds = intervalSeconds;
            self.intervalId = window.setInterval(self.refresh, intervalSeconds * 1000);
        }
    };
};

cronenberg.dashboards = new cronenberg.DashboardManager();
