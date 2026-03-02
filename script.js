/**
 * Digital Ocean Snapshot Manager - Frontend JS
 * Version: 1.4.0
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */
jQuery(function ($) {
    'use strict';

    var PLUGIN_VERSION = '1.4.0';

    /**
     * Escape HTML entities to prevent XSS when injecting into DOM
     * @param {string} str
     * @returns {string}
     */
    function escHtml(str) {
        if (str === null || str === undefined) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(String(str)));
        return div.innerHTML;
    }

    /**
     * sprintf-like replacement: replaces %s in order
     * @param {string} tpl
     * @param {...string} args
     * @returns {string}
     */
    function sprintf(tpl) {
        var args = Array.prototype.slice.call(arguments, 1);
        var i = 0;
        return tpl.replace(/%s/g, function () {
            return args[i++] !== undefined ? args[i - 1] : '%s';
        });
    }

    /**
     * Make an AJAX call to the plugin backend
     * @param {string} action
     * @param {object} params
     * @param {function} callback
     */
    function apiCall(action, params, callback) {
        params = params || {};
        params.call = 'plugin_dosnapshots_' + action;
        params.sectok = JSINFO.sectok || '';

        $.ajax({
            url: DOKU_BASE + 'lib/exe/ajax.php',
            type: 'POST',
            dataType: 'json',
            data: params,
            success: function (resp) {
                callback(resp);
            },
            error: function (xhr, status, err) {
                callback({ success: false, error: 'AJAX error: ' + (err || status) });
            }
        });
    }

    /**
     * Format a date string for display
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            var d = new Date(dateStr);
            return d.toLocaleString();
        } catch (e) {
            return escHtml(dateStr);
        }
    }

    /**
     * Initialize a snapshot manager instance
     * @param {jQuery} $container
     */
    function initManager($container) {
        var dropletId = $container.data('droplet-id');
        var containerId = $container.attr('id');
        var allowRestore = $container.data('allow-restore') === true || $container.data('allow-restore') === 'true';
        var allowDelete = $container.data('allow-delete') === true || $container.data('allow-delete') === 'true';
        var lang = $container.data('lang') || {};
        var version = $container.data('version') || PLUGIN_VERSION;

        // Build the UI skeleton
        var html = '';
        html += '<div class="dosnapshots-header">';
        html += '  <h3>' + escHtml(lang.title || 'Digital Ocean Snapshot Manager');
        html += '    <span class="dosnapshots-version">v' + escHtml(version) + '</span>';
        html += '  </h3>';
        html += '  <div class="dosnapshots-header-actions">';
        html += '    <button type="button" class="dosnapshots-btn dosnapshots-btn-primary js-dosnapshots-refresh">';
        html += escHtml(lang.btn_refresh || 'Refresh');
        html += '    </button>';
        html += '  </div>';
        html += '</div>';
        html += '<div class="js-dosnapshots-messages"></div>';
        html += '<div class="js-dosnapshots-droplet-info"></div>';
        html += '<div class="js-dosnapshots-power-controls"></div>';
        html += '<div class="js-dosnapshots-create-form"></div>';
        html += '<div class="js-dosnapshots-snapshot-list"></div>';
        html += '<div class="dosnapshots-footer">';
        html += '  ' + escHtml(lang.version || 'Version') + ': ' + escHtml(version);
        html += '</div>';

        $container.html(html);

        var $messages = $container.find('.js-dosnapshots-messages');
        var $dropletInfo = $container.find('.js-dosnapshots-droplet-info');
        var $powerControls = $container.find('.js-dosnapshots-power-controls');
        var $createForm = $container.find('.js-dosnapshots-create-form');
        var $snapshotList = $container.find('.js-dosnapshots-snapshot-list');
        var $refreshBtn = $container.find('.js-dosnapshots-refresh');

        var currentDropletStatus = 'unknown';

        /**
         * Show a message
         */
        function showMsg(text, type) {
            type = type || 'info';
            var cls = 'dosnapshots-msg dosnapshots-msg-' + escHtml(type);
            $messages.html('<div class="' + cls + '">' + escHtml(text) + '</div>');
            // Auto-clear after 8 seconds
            setTimeout(function () {
                $messages.find('.dosnapshots-msg').fadeOut(300, function () {
                    $(this).remove();
                });
            }, 8000);
        }

        /**
         * Render droplet info panel
         */
        function renderDropletInfo(droplet) {
            if (!droplet) {
                $dropletInfo.html('');
                return;
            }
            currentDropletStatus = droplet.status || 'unknown';
            var statusClass = 'dosnapshots-status-' + escHtml(currentDropletStatus);

            var ip = '—';
            if (droplet.networks && droplet.networks.v4 && droplet.networks.v4.length > 0) {
                ip = droplet.networks.v4[0].ip_address || '—';
            }

            var imgName = '—';
            if (droplet.image) {
                imgName = droplet.image.distribution + ' ' + droplet.image.name;
            }

            var infoHtml = '<h4>' + escHtml(lang.droplet_info || 'Droplet Information') + '</h4>';
            infoHtml += '<dl class="dosnapshots-droplet-info">';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_name) + '</dt><dd>' + escHtml(droplet.name) + '</dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_status) + '</dt><dd><span class="dosnapshots-status ' + statusClass + '">' + escHtml(currentDropletStatus) + '</span></dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_ip) + '</dt><dd>' + escHtml(ip) + '</dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_region) + '</dt><dd>' + escHtml(droplet.region ? droplet.region.name : '—') + '</dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_size) + '</dt><dd>' + escHtml(droplet.size_slug || '—') + '</dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_image) + '</dt><dd>' + escHtml(imgName) + '</dd></div>';
            infoHtml += '  <div><dt>' + escHtml(lang.droplet_created) + '</dt><dd>' + formatDate(droplet.created_at) + '</dd></div>';
            infoHtml += '</dl>';

            $dropletInfo.html(infoHtml);
            renderPowerControls();
        }

        /**
         * Render power on/off controls
         */
        function renderPowerControls() {
            var html = '<div class="dosnapshots-power-controls">';
            if (currentDropletStatus === 'active') {
                html += '<button type="button" class="dosnapshots-btn dosnapshots-btn-warning dosnapshots-btn-sm js-dosnapshots-power-off">';
                html += escHtml(lang.btn_power_off || 'Power Off Droplet');
                html += '</button>';
                html += '<button type="button" class="dosnapshots-btn dosnapshots-btn-sm js-dosnapshots-reboot">';
                html += escHtml(lang.btn_reboot || 'Reboot Droplet');
                html += '</button>';
                html += '<a href="https://cloud.digitalocean.com/droplets/' + encodeURIComponent(dropletId) + '/console" ';
                html += '  target="_blank" rel="noopener noreferrer" ';
                html += '  class="dosnapshots-btn dosnapshots-btn-primary dosnapshots-btn-sm">';
                html += escHtml(lang.btn_console || 'Open Console');
                html += '</a>';
            } else if (currentDropletStatus === 'off') {
                html += '<button type="button" class="dosnapshots-btn dosnapshots-btn-primary dosnapshots-btn-sm js-dosnapshots-power-on">';
                html += escHtml(lang.btn_power_on || 'Power On Droplet');
                html += '</button>';
            }
            html += '</div>';
            $powerControls.html(html);

            // Bind power events
            $powerControls.find('.js-dosnapshots-power-off').on('click', function () {
                if (!confirm(lang.confirm_power_off || 'Are you sure you want to power off this droplet?')) return;
                var $btn = $(this);
                $btn.prop('disabled', true);
                apiCall('power_off', { droplet_id: dropletId }, function (resp) {
                    $btn.prop('disabled', false);
                    if (resp.success) {
                        showMsg(resp.message, 'success');
                        // Refresh after short delay
                        setTimeout(loadAll, 3000);
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });

            $powerControls.find('.js-dosnapshots-power-on').on('click', function () {
                var $btn = $(this);
                $btn.prop('disabled', true);
                apiCall('power_on', { droplet_id: dropletId }, function (resp) {
                    $btn.prop('disabled', false);
                    if (resp.success) {
                        showMsg(resp.message, 'success');
                        setTimeout(loadAll, 3000);
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });

            $powerControls.find('.js-dosnapshots-reboot').on('click', function () {
                if (!confirm(lang.confirm_reboot || 'Are you sure you want to reboot this droplet?')) return;
                var $btn = $(this);
                $btn.prop('disabled', true);
                apiCall('reboot', { droplet_id: dropletId }, function (resp) {
                    $btn.prop('disabled', false);
                    if (resp.success) {
                        showMsg(resp.message, 'success');
                        setTimeout(loadAll, 5000);
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });
        }

        /**
         * Render the snapshot creation form
         */
        function renderCreateForm() {
            var html = '<div class="dosnapshots-create-form">';
            html += '  <label for="dosnapshots-new-name-' + escHtml(dropletId) + '">';
            html += escHtml(lang.snapshot_name_label || 'Snapshot Name') + ':</label>';
            html += '  <input type="text" id="dosnapshots-new-name-' + escHtml(dropletId) + '" ';
            html += '    placeholder="' + escHtml(lang.snapshot_name_hint || 'Leave blank for auto-generated name') + '" />';
            html += '  <button type="button" class="dosnapshots-btn dosnapshots-btn-primary js-dosnapshots-create">';
            html += escHtml(lang.btn_create || 'Create Snapshot');
            html += '  </button>';
            html += '</div>';

            $createForm.html(html);

            $createForm.find('.js-dosnapshots-create').on('click', function () {
                var $btn = $(this);
                var nameInput = $createForm.find('input[type="text"]').val().trim();
                $btn.prop('disabled', true).html('<span class="dosnapshots-spinner"></span>' + escHtml(lang.btn_create));

                apiCall('create', {
                    droplet_id: dropletId,
                    snapshot_name: nameInput
                }, function (resp) {
                    $btn.prop('disabled', false).html(escHtml(lang.btn_create));
                    if (resp.success) {
                        showMsg(resp.message || lang.msg_snapshot_created, 'success');
                        $createForm.find('input[type="text"]').val('');
                        // Refresh snapshot list after delay (snapshot takes time)
                        setTimeout(loadSnapshots, 5000);
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });
        }

        /**
         * Render the snapshot table
         * @param {Array} snapshots
         */
        function renderSnapshots(snapshots) {
            if (!snapshots || snapshots.length === 0) {
                $snapshotList.html('<p class="dosnapshots-msg dosnapshots-msg-info">' +
                    escHtml(lang.no_snapshots || 'No snapshots found.') + '</p>');
                return;
            }

            var html = '<h4>' + escHtml(lang.snapshots || 'Snapshots') + ' (' + snapshots.length + ')</h4>';
            html += '<div class="dosnapshots-table-wrap">';
            html += '<table class="dosnapshots-table">';
            html += '<thead><tr>';
            html += '  <th>' + escHtml(lang.snapshot_name) + '</th>';
            html += '  <th>' + escHtml(lang.snapshot_id) + '</th>';
            html += '  <th>' + escHtml(lang.snapshot_size) + '</th>';
            html += '  <th>' + escHtml(lang.snapshot_min_disk) + '</th>';
            html += '  <th>' + escHtml(lang.snapshot_created) + '</th>';
            html += '  <th>' + escHtml(lang.snapshot_regions) + '</th>';
            html += '  <th>' + escHtml(lang.actions) + '</th>';
            html += '</tr></thead>';
            html += '<tbody>';

            for (var i = 0; i < snapshots.length; i++) {
                var snap = snapshots[i];
                html += '<tr>';
                html += '  <td>' + escHtml(snap.name) + '</td>';
                html += '  <td>' + escHtml(snap.id) + '</td>';
                html += '  <td>' + escHtml(snap.size_gigabytes) + '</td>';
                html += '  <td>' + escHtml(snap.min_disk_size) + '</td>';
                html += '  <td>' + formatDate(snap.created_at) + '</td>';
                html += '  <td>' + escHtml((snap.regions || []).join(', ')) + '</td>';
                html += '  <td class="dosnapshots-actions-cell">';

                if (allowRestore) {
                    html += '  <button type="button" class="dosnapshots-btn dosnapshots-btn-warning dosnapshots-btn-sm js-dosnapshots-restore" ';
                    html += '    data-snapshot-id="' + escHtml(snap.id) + '" ';
                    html += '    data-snapshot-name="' + escHtml(snap.name) + '">';
                    html += escHtml(lang.btn_restore || 'Restore');
                    html += '  </button> ';
                }

                if (allowDelete) {
                    html += '  <button type="button" class="dosnapshots-btn dosnapshots-btn-danger dosnapshots-btn-sm js-dosnapshots-delete" ';
                    html += '    data-snapshot-id="' + escHtml(snap.id) + '" ';
                    html += '    data-snapshot-name="' + escHtml(snap.name) + '">';
                    html += escHtml(lang.btn_delete || 'Delete');
                    html += '  </button>';
                }

                html += '  </td>';
                html += '</tr>';
            }

            html += '</tbody></table></div>';
            $snapshotList.html(html);

            // Bind restore
            $snapshotList.find('.js-dosnapshots-restore').on('click', function () {
                var $btn = $(this);
                var snapId = $btn.data('snapshot-id');
                var snapName = $btn.data('snapshot-name');
                var msg = sprintf(lang.confirm_restore || 'Restore from "%s"?', snapName);
                if (!confirm(msg)) return;

                $btn.prop('disabled', true);
                apiCall('restore', {
                    droplet_id: dropletId,
                    snapshot_id: snapId,
                    snapshot_name: snapName
                }, function (resp) {
                    $btn.prop('disabled', false);
                    if (resp.success) {
                        showMsg(resp.message, 'success');
                        setTimeout(loadAll, 5000);
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });

            // Bind delete
            $snapshotList.find('.js-dosnapshots-delete').on('click', function () {
                var $btn = $(this);
                var snapId = $btn.data('snapshot-id');
                var snapName = $btn.data('snapshot-name');
                var msg = sprintf(lang.confirm_delete || 'Delete "%s"?', snapName);
                if (!confirm(msg)) return;

                $btn.prop('disabled', true);
                apiCall('delete', {
                    droplet_id: dropletId,
                    snapshot_id: snapId,
                    snapshot_name: snapName
                }, function (resp) {
                    $btn.prop('disabled', false);
                    if (resp.success) {
                        showMsg(resp.message, 'success');
                        loadSnapshots();
                    } else {
                        showMsg(resp.error, 'error');
                    }
                });
            });
        }

        /**
         * Load droplet info
         */
        function loadDropletInfo() {
            apiCall('info', { droplet_id: dropletId }, function (resp) {
                if (resp.success && resp.data && resp.data.droplet) {
                    renderDropletInfo(resp.data.droplet);
                } else {
                    showMsg(resp.error || 'Failed to load droplet info', 'error');
                }
            });
        }

        /**
         * Load snapshots
         */
        function loadSnapshots() {
            apiCall('list', { droplet_id: dropletId }, function (resp) {
                if (resp.success && resp.data && resp.data.snapshots) {
                    renderSnapshots(resp.data.snapshots);
                } else {
                    showMsg(resp.error || 'Failed to load snapshots', 'error');
                }
            });
        }

        /**
         * Load everything
         */
        function loadAll() {
            loadDropletInfo();
            loadSnapshots();
        }

        // Bind refresh
        $refreshBtn.on('click', function () {
            $messages.html('');
            loadAll();
        });

        // Build create form and initial load
        renderCreateForm();
        loadAll();

        // ===== METRICS SECTION =====
        var metricsHours = 6;
        var metricsLoaded = false;
        var $metricsContainer = $('#' + containerId + '-metrics');

        function initMetrics() {
            if (!$metricsContainer.length) return;

            var mhtml = '<div class="dosnapshots-metrics-section">';

            // Collapsible toggle bar
            mhtml += '  <div class="dosnapshots-metrics-toggle js-dosnapshots-metrics-toggle">';
            mhtml += '    <span class="dosnapshots-metrics-toggle-icon">&#9654;</span> ';
            mhtml += '    <span class="dosnapshots-metrics-toggle-label">' + escHtml(lang.metrics_show || 'Show Metrics') + '</span>';
            mhtml += '  </div>';

            // Collapsible body (hidden by default)
            mhtml += '  <div class="dosnapshots-metrics-body" style="display:none;">';
            mhtml += '    <div class="dosnapshots-metrics-header">';
            mhtml += '      <h4>' + escHtml(lang.metrics || 'Metrics') + '</h4>';
            mhtml += '      <div class="dosnapshots-metrics-timeframe">';
            mhtml += '        <button type="button" data-hours="6" class="active">' + escHtml(lang.metrics_6h || '6 Hours') + '</button>';
            mhtml += '        <button type="button" data-hours="24">' + escHtml(lang.metrics_24h || '24 Hours') + '</button>';
            mhtml += '        <button type="button" data-hours="168">' + escHtml(lang.metrics_7d || '7 Days') + '</button>';
            mhtml += '        <button type="button" data-hours="336">' + escHtml(lang.metrics_14d || '14 Days') + '</button>';
            mhtml += '      </div>';
            mhtml += '    </div>';
            mhtml += '    <div class="dosnapshots-metrics-note">' + escHtml(lang.metrics_note || '') + '</div>';
            mhtml += '    <div class="dosnapshots-metrics-grid">';

            // Metric cards
            mhtml += metricCardHtml('cpu', lang.metric_cpu || 'CPU Usage');
            mhtml += metricCardHtml('memory', lang.metric_memory || 'Memory Usage');
            mhtml += metricCardHtml('bandwidth', lang.metric_bandwidth || 'Bandwidth');
            mhtml += metricCardHtml('load', lang.metric_load || 'Load Average');
            mhtml += metricCardHtml('filesystem', lang.metric_filesystem || 'Disk Usage');

            mhtml += '    </div>';
            mhtml += '  </div>'; // end body
            mhtml += '</div>';

            $metricsContainer.html(mhtml);

            var $toggle = $metricsContainer.find('.js-dosnapshots-metrics-toggle');
            var $body = $metricsContainer.find('.dosnapshots-metrics-body');
            var $icon = $toggle.find('.dosnapshots-metrics-toggle-icon');
            var $label = $toggle.find('.dosnapshots-metrics-toggle-label');

            $toggle.on('click', function () {
                var isHidden = $body.is(':hidden');
                if (isHidden) {
                    $body.slideDown(200);
                    $icon.html('&#9660;');
                    $label.text(lang.metrics_hide || 'Hide Metrics');
                    // Lazy-load: fetch metrics on first expand
                    if (!metricsLoaded) {
                        metricsLoaded = true;
                        loadAllMetrics();
                    }
                } else {
                    $body.slideUp(200);
                    $icon.html('&#9654;');
                    $label.text(lang.metrics_show || 'Show Metrics');
                }
            });

            // Timeframe buttons
            $metricsContainer.find('.dosnapshots-metrics-timeframe button').on('click', function () {
                $metricsContainer.find('.dosnapshots-metrics-timeframe button').removeClass('active');
                $(this).addClass('active');
                metricsHours = parseInt($(this).data('hours'), 10);
                loadAllMetrics();
            });
        }

        function metricCardHtml(id, title) {
            var h = '<div class="dosnapshots-metric-card" data-metric="' + escHtml(id) + '">';
            h += '  <div class="dosnapshots-metric-card-header">';
            h += '    <span class="dosnapshots-metric-title">' + escHtml(title) + '</span>';
            h += '    <span class="dosnapshots-metric-value js-metric-value-' + escHtml(id) + '"></span>';
            h += '  </div>';
            h += '  <div class="dosnapshots-metric-canvas-wrap">';
            h += '    <canvas id="dosnapshots-chart-' + escHtml(containerId) + '-' + escHtml(id) + '"></canvas>';
            h += '  </div>';
            h += '  <div class="dosnapshots-metric-legend js-metric-legend-' + escHtml(id) + '"></div>';
            h += '</div>';
            return h;
        }

        function loadAllMetrics() {
            var metrics = ['cpu', 'memory', 'bandwidth', 'load', 'filesystem'];
            for (var i = 0; i < metrics.length; i++) {
                loadMetric(metrics[i]);
            }
        }

        function loadMetric(metric) {
            var canvasId = 'dosnapshots-chart-' + containerId + '-' + metric;
            var $canvas = $('#' + canvasId);
            var $card = $metricsContainer.find('[data-metric="' + metric + '"]');
            var $value = $card.find('.js-metric-value-' + metric);
            var $legend = $card.find('.js-metric-legend-' + metric);

            // Show loading
            $value.html('<span class="dosnapshots-spinner"></span>');

            apiCall('metrics', {
                droplet_id: dropletId,
                metric: metric,
                hours: metricsHours
            }, function (resp) {
                if (!resp.success || !resp.data || !resp.data.data) {
                    $value.text('—');
                    showNoData($canvas);
                    return;
                }
                renderMetric(metric, resp.data.data, $canvas, $value, $legend);
            });
        }

        function showNoData($canvas) {
            var el = $canvas[0];
            if (!el) return;
            var ctx = el.getContext('2d');
            var rect = el.parentElement.getBoundingClientRect();
            el.width = rect.width * (window.devicePixelRatio || 1);
            el.height = rect.height * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, rect.width, rect.height);
            ctx.fillStyle = '#ccc';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(lang.metrics_no_data || 'No data', rect.width / 2, rect.height / 2 + 4);
        }

        /**
         * Extract time-series values array from DO metric result
         * DO returns: { data: { result: [ { metric: {...}, values: [[ts, val], ...] } ] } }
         */
        function extractValues(doData) {
            if (!doData || !doData.data || !doData.data.result || doData.data.result.length === 0) {
                return [];
            }
            return doData.data.result[0].values || [];
        }

        /**
         * Draw a sparkline on a canvas
         * @param {HTMLCanvasElement} canvas
         * @param {Array} series  Array of { values: [[ts,val],...], color: string }
         * @param {object} opts   { filled: bool, yMin, yMax }
         */
        function drawSparkline(canvas, series, opts) {
            opts = opts || {};
            var dpr = window.devicePixelRatio || 1;
            var rect = canvas.parentElement.getBoundingClientRect();
            var w = rect.width;
            var h = rect.height;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            // Find global x/y range
            var xMin = Infinity, xMax = -Infinity;
            var yMin = opts.yMin !== undefined ? opts.yMin : Infinity;
            var yMax = opts.yMax !== undefined ? opts.yMax : -Infinity;

            for (var s = 0; s < series.length; s++) {
                var vals = series[s].values;
                for (var i = 0; i < vals.length; i++) {
                    var ts = vals[i][0];
                    var v = parseFloat(vals[i][1]);
                    if (ts < xMin) xMin = ts;
                    if (ts > xMax) xMax = ts;
                    if (opts.yMin === undefined && v < yMin) yMin = v;
                    if (opts.yMax === undefined && v > yMax) yMax = v;
                }
            }

            if (xMin === xMax || yMin === yMax) {
                // flat line
                yMin = yMin - 1;
                yMax = yMax + 1;
            }

            var padTop = 2, padBot = 2, padLeft = 1, padRight = 1;
            var plotW = w - padLeft - padRight;
            var plotH = h - padTop - padBot;

            // Draw subtle grid lines
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            for (var g = 0; g <= 4; g++) {
                var gy = padTop + (plotH / 4) * g;
                ctx.beginPath();
                ctx.moveTo(padLeft, Math.round(gy) + 0.5);
                ctx.lineTo(padLeft + plotW, Math.round(gy) + 0.5);
                ctx.stroke();
            }

            // Draw each series
            for (s = 0; s < series.length; s++) {
                var data = series[s].values;
                var color = series[s].color;
                if (data.length < 2) continue;

                ctx.beginPath();
                for (i = 0; i < data.length; i++) {
                    var x = padLeft + ((data[i][0] - xMin) / (xMax - xMin)) * plotW;
                    var y = padTop + plotH - ((parseFloat(data[i][1]) - yMin) / (yMax - yMin)) * plotH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                if (opts.filled && series.length === 1) {
                    // Close and fill
                    ctx.lineTo(padLeft + plotW, padTop + plotH);
                    ctx.lineTo(padLeft, padTop + plotH);
                    ctx.closePath();
                    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb(', 'rgba(');
                    ctx.fill();
                }
            }
        }

        function renderMetric(metric, rawData, $canvas, $value, $legend) {
            var canvas = $canvas[0];
            if (!canvas) return;

            switch (metric) {
                case 'cpu':
                    renderCpu(rawData, canvas, $value, $legend);
                    break;
                case 'memory':
                    renderMemory(rawData, canvas, $value, $legend);
                    break;
                case 'bandwidth':
                    renderBandwidth(rawData, canvas, $value, $legend);
                    break;
                case 'load':
                    renderLoad(rawData, canvas, $value, $legend);
                    break;
                case 'filesystem':
                    renderFilesystem(rawData, canvas, $value, $legend);
                    break;
            }
        }

        function renderCpu(rawData, canvas, $value, $legend) {
            // CPU data comes as multiple modes (idle, user, system, etc.)
            // We want usage = 100 - idle%
            // DO returns cumulative CPU seconds; we need to compute rate differences
            if (!rawData || !rawData.data || !rawData.data.result) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            var results = rawData.data.result;
            var idleResult = null;
            var totalByTs = {};

            // Sum up all modes and find idle
            for (var r = 0; r < results.length; r++) {
                var mode = results[r].metric.mode;
                var vals = results[r].values;
                if (mode === 'idle') idleResult = vals;
                for (var i = 0; i < vals.length; i++) {
                    var ts = vals[i][0];
                    var v = parseFloat(vals[i][1]);
                    if (!totalByTs[ts]) totalByTs[ts] = 0;
                    totalByTs[ts] += v;
                }
            }

            if (!idleResult || idleResult.length < 2) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            // Compute usage % from deltas
            var usageData = [];
            var idleMap = {};
            for (i = 0; i < idleResult.length; i++) {
                idleMap[idleResult[i][0]] = parseFloat(idleResult[i][1]);
            }

            var sortedTs = Object.keys(totalByTs).map(Number).sort();
            for (i = 1; i < sortedTs.length; i++) {
                var t0 = sortedTs[i - 1], t1 = sortedTs[i];
                var totalDelta = totalByTs[t1] - totalByTs[t0];
                var idleDelta = (idleMap[t1] || 0) - (idleMap[t0] || 0);
                var usage = 0;
                if (totalDelta > 0) {
                    usage = Math.max(0, Math.min(100, ((totalDelta - idleDelta) / totalDelta) * 100));
                }
                usageData.push([t1, usage.toFixed(1)]);
            }

            if (usageData.length > 0) {
                var lastVal = parseFloat(usageData[usageData.length - 1][1]);
                $value.text(lastVal.toFixed(1) + (lang.metrics_percent || '%'));
            } else {
                $value.text('—');
            }

            drawSparkline(canvas, [{ values: usageData, color: 'rgb(40, 167, 69)' }], { filled: true, yMin: 0, yMax: 100 });
            $legend.html('');
        }

        function renderMemory(rawData, canvas, $value, $legend) {
            var freeVals = extractValues(rawData.free);
            var totalVals = extractValues(rawData.total);

            if (freeVals.length < 2 || totalVals.length < 2) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            // Build a map of total by closest timestamp
            var totalMap = {};
            for (var i = 0; i < totalVals.length; i++) {
                totalMap[totalVals[i][0]] = parseFloat(totalVals[i][1]);
            }

            var usageData = [];
            for (i = 0; i < freeVals.length; i++) {
                var ts = freeVals[i][0];
                var free = parseFloat(freeVals[i][1]);
                var total = totalMap[ts];
                if (total && total > 0) {
                    var pct = ((total - free) / total) * 100;
                    usageData.push([ts, pct.toFixed(1)]);
                }
            }

            if (usageData.length > 0) {
                $value.text(parseFloat(usageData[usageData.length - 1][1]).toFixed(1) + (lang.metrics_percent || '%'));
            } else {
                $value.text('—');
            }

            drawSparkline(canvas, [{ values: usageData, color: 'rgb(111, 66, 193)' }], { filled: true, yMin: 0, yMax: 100 });
            $legend.html('');
        }

        function renderBandwidth(rawData, canvas, $value, $legend) {
            var inVals = extractValues(rawData.inbound);
            var outVals = extractValues(rawData.outbound);

            if (inVals.length < 2 && outVals.length < 2) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            // Convert bytes to Mbps (values are bytes, rate per data point interval)
            function toMbps(vals) {
                var converted = [];
                for (var i = 1; i < vals.length; i++) {
                    var dt = vals[i][0] - vals[i - 1][0];
                    if (dt <= 0) dt = 1;
                    var bytes = parseFloat(vals[i][1]) - parseFloat(vals[i - 1][1]);
                    var mbps = Math.max(0, (bytes * 8) / (dt * 1000000));
                    converted.push([vals[i][0], mbps.toFixed(3)]);
                }
                return converted;
            }

            var inMbps = toMbps(inVals);
            var outMbps = toMbps(outVals);

            var lastIn = inMbps.length > 0 ? parseFloat(inMbps[inMbps.length - 1][1]).toFixed(2) : '0';
            var lastOut = outMbps.length > 0 ? parseFloat(outMbps[outMbps.length - 1][1]).toFixed(2) : '0';
            $value.text(lastIn + ' / ' + lastOut + ' Mbps');

            var series = [];
            if (inMbps.length > 1) series.push({ values: inMbps, color: 'rgb(0, 123, 255)' });
            if (outMbps.length > 1) series.push({ values: outMbps, color: 'rgb(255, 159, 64)' });

            drawSparkline(canvas, series, { yMin: 0 });
            $legend.html(
                legendItem('rgb(0, 123, 255)', lang.metrics_inbound || 'In') +
                legendItem('rgb(255, 159, 64)', lang.metrics_outbound || 'Out')
            );
        }

        function renderLoad(rawData, canvas, $value, $legend) {
            var l1 = extractValues(rawData.load1);
            var l5 = extractValues(rawData.load5);
            var l15 = extractValues(rawData.load15);

            if (l1.length < 2 && l5.length < 2 && l15.length < 2) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            if (l1.length > 0) {
                $value.text(parseFloat(l1[l1.length - 1][1]).toFixed(2));
            }

            var series = [];
            if (l1.length > 1) series.push({ values: l1, color: 'rgb(0, 123, 255)' });
            if (l5.length > 1) series.push({ values: l5, color: 'rgb(40, 167, 69)' });
            if (l15.length > 1) series.push({ values: l15, color: 'rgb(111, 66, 193)' });

            drawSparkline(canvas, series, { yMin: 0 });
            $legend.html(
                legendItem('rgb(0, 123, 255)', lang.metrics_load1 || '1m') +
                legendItem('rgb(40, 167, 69)', lang.metrics_load5 || '5m') +
                legendItem('rgb(111, 66, 193)', lang.metrics_load15 || '15m')
            );
        }

        function renderFilesystem(rawData, canvas, $value, $legend) {
            var freeVals = extractValues(rawData.free);
            var sizeVals = extractValues(rawData.size);

            if (freeVals.length < 2 || sizeVals.length < 2) {
                $value.text('—');
                showNoData($(canvas));
                return;
            }

            var sizeMap = {};
            for (var i = 0; i < sizeVals.length; i++) {
                sizeMap[sizeVals[i][0]] = parseFloat(sizeVals[i][1]);
            }

            var usageData = [];
            for (i = 0; i < freeVals.length; i++) {
                var ts = freeVals[i][0];
                var free = parseFloat(freeVals[i][1]);
                var sz = sizeMap[ts];
                if (sz && sz > 0) {
                    var pct = ((sz - free) / sz) * 100;
                    usageData.push([ts, pct.toFixed(1)]);
                }
            }

            if (usageData.length > 0) {
                $value.text(parseFloat(usageData[usageData.length - 1][1]).toFixed(1) + (lang.metrics_percent || '%'));
            } else {
                $value.text('—');
            }

            drawSparkline(canvas, [{ values: usageData, color: 'rgb(52, 168, 83)' }], { filled: true, yMin: 0, yMax: 100 });
            $legend.html('');
        }

        function legendItem(color, label) {
            return '<span class="dosnapshots-legend-item">' +
                '<span class="dosnapshots-legend-swatch" style="background:' + escHtml(color) + ';"></span>' +
                escHtml(label) + '</span>';
        }

        // Init metrics after main UI
        initMetrics();
    }

    // Initialize all dosnapshots containers on the page
    $('.dosnapshots-container').each(function () {
        initManager($(this));
    });
});
