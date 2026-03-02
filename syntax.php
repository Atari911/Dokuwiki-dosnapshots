<?php
/**
 * Syntax plugin for dosnapshots
 *
 * Embeds the Digital Ocean Snapshot Manager on a wiki page.
 * Usage: {{dosnapshots>droplet_id}}
 *        {{dosnapshots}}  (uses default droplet from config)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */

class syntax_plugin_dosnapshots extends DokuWiki_Syntax_Plugin {

    const VERSION = '1.4.0';

    /** @inheritdoc */
    public function getType() {
        return 'substition';
    }

    /** @inheritdoc */
    public function getPType() {
        return 'block';
    }

    /** @inheritdoc */
    public function getSort() {
        return 305;
    }

    /** @inheritdoc */
    public function connectTo($mode) {
        $this->Lexer->addSpecialPattern('\{\{dosnapshots>[^}]*\}\}', $mode, 'plugin_dosnapshots');
        $this->Lexer->addSpecialPattern('\{\{dosnapshots\}\}', $mode, 'plugin_dosnapshots');
    }

    /** @inheritdoc */
    public function handle($match, $state, $pos, Doku_Handler $handler) {
        $dropletId = '';
        if(preg_match('/\{\{dosnapshots>([^}]*)\}\}/', $match, $m)) {
            $dropletId = trim($m[1]);
        }
        return array('droplet_id' => $dropletId);
    }

    /** @inheritdoc */
    public function render($mode, Doku_Renderer $renderer, $data) {
        if($mode !== 'xhtml') return false;

        /** @var helper_plugin_dosnapshots $helper */
        $helper = $this->loadHelper('dosnapshots');

        if(!$helper->isConfigured()) {
            $renderer->doc .= '<div class="dosnapshots-error">' . hsc($this->getLang('no_token')) . '</div>';
            return true;
        }

        if(!$helper->userHasAccess()) {
            $renderer->doc .= '<div class="dosnapshots-error">' . hsc($this->getLang('no_permission')) . '</div>';
            return true;
        }

        $dropletId = $data['droplet_id'];
        if(empty($dropletId)) {
            $dropletId = $this->getConf('default_droplet_id');
        }
        if(empty($dropletId)) {
            $renderer->doc .= '<div class="dosnapshots-error">' . hsc($this->getLang('no_droplet')) . '</div>';
            return true;
        }

        // Sanitize: droplet IDs are numeric
        if(!ctype_digit($dropletId)) {
            $renderer->doc .= '<div class="dosnapshots-error">' . hsc($this->getLang('err_invalid_droplet_id')) . '</div>';
            return true;
        }

        $allowRestore = $this->getConf('allow_restore') ? 'true' : 'false';
        $allowDelete  = $this->getConf('allow_delete') ? 'true' : 'false';

        // Localized strings for JS — escaped for safe embedding in HTML attribute
        $jsLang = array(
            'droplet_info'      => $this->getLang('droplet_info'),
            'droplet_name'      => $this->getLang('droplet_name'),
            'droplet_status'    => $this->getLang('droplet_status'),
            'droplet_ip'        => $this->getLang('droplet_ip'),
            'droplet_region'    => $this->getLang('droplet_region'),
            'droplet_image'     => $this->getLang('droplet_image'),
            'droplet_size'      => $this->getLang('droplet_size'),
            'droplet_created'   => $this->getLang('droplet_created'),
            'snapshots'         => $this->getLang('snapshots'),
            'snapshot_name'     => $this->getLang('snapshot_name'),
            'snapshot_id'       => $this->getLang('snapshot_id'),
            'snapshot_size'     => $this->getLang('snapshot_size'),
            'snapshot_created'  => $this->getLang('snapshot_created'),
            'snapshot_regions'  => $this->getLang('snapshot_regions'),
            'snapshot_min_disk' => $this->getLang('snapshot_min_disk'),
            'actions'           => $this->getLang('actions'),
            'btn_refresh'       => $this->getLang('btn_refresh'),
            'btn_create'        => $this->getLang('btn_create'),
            'btn_restore'       => $this->getLang('btn_restore'),
            'btn_delete'        => $this->getLang('btn_delete'),
            'btn_power_off'     => $this->getLang('btn_power_off'),
            'btn_power_on'      => $this->getLang('btn_power_on'),
            'btn_reboot'        => $this->getLang('btn_reboot'),
            'btn_console'       => $this->getLang('btn_console'),
            'create_snapshot'   => $this->getLang('create_snapshot'),
            'snapshot_name_label' => $this->getLang('snapshot_name_label'),
            'snapshot_name_hint'  => $this->getLang('snapshot_name_hint'),
            'no_snapshots'      => $this->getLang('no_snapshots'),
            'confirm_delete'    => $this->getLang('confirm_delete'),
            'confirm_restore'   => $this->getLang('confirm_restore'),
            'confirm_power_off' => $this->getLang('confirm_power_off'),
            'confirm_reboot'    => $this->getLang('confirm_reboot'),
            'msg_snapshot_created' => $this->getLang('msg_snapshot_created'),
            'msg_action_pending'   => $this->getLang('msg_action_pending'),
            'title'             => $this->getLang('title'),
            'version'           => $this->getLang('version'),
            'metrics'           => $this->getLang('metrics'),
            'metrics_show'      => $this->getLang('metrics_show'),
            'metrics_hide'      => $this->getLang('metrics_hide'),
            'metrics_timeframe' => $this->getLang('metrics_timeframe'),
            'metrics_6h'        => $this->getLang('metrics_6h'),
            'metrics_24h'       => $this->getLang('metrics_24h'),
            'metrics_7d'        => $this->getLang('metrics_7d'),
            'metrics_14d'       => $this->getLang('metrics_14d'),
            'metric_cpu'        => $this->getLang('metric_cpu'),
            'metric_memory'     => $this->getLang('metric_memory'),
            'metric_disk_io'    => $this->getLang('metric_disk_io'),
            'metric_bandwidth'  => $this->getLang('metric_bandwidth'),
            'metric_load'       => $this->getLang('metric_load'),
            'metric_filesystem' => $this->getLang('metric_filesystem'),
            'metrics_percent'   => $this->getLang('metrics_percent'),
            'metrics_mbps'      => $this->getLang('metrics_mbps'),
            'metrics_read'      => $this->getLang('metrics_read'),
            'metrics_write'     => $this->getLang('metrics_write'),
            'metrics_inbound'   => $this->getLang('metrics_inbound'),
            'metrics_outbound'  => $this->getLang('metrics_outbound'),
            'metrics_load1'     => $this->getLang('metrics_load1'),
            'metrics_load5'     => $this->getLang('metrics_load5'),
            'metrics_load15'    => $this->getLang('metrics_load15'),
            'metrics_no_data'   => $this->getLang('metrics_no_data'),
            'metrics_note'      => $this->getLang('metrics_note'),
        );

        // Use json_encode with HEX options to safely embed in HTML
        // JSON_HEX_TAG escapes < and >, JSON_HEX_AMP escapes &, etc.
        $jsonLang = json_encode($jsLang, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

        // Generate a unique container ID for multiple embeds on one page
        $containerId = 'dosnapshots-' . $dropletId . '-' . mt_rand(1000, 9999);

        $renderer->doc .= '<div id="' . hsc($containerId) . '" class="dosnapshots-container" '
            . 'data-droplet-id="' . hsc($dropletId) . '" '
            . 'data-allow-restore="' . $allowRestore . '" '
            . 'data-allow-delete="' . $allowDelete . '" '
            . 'data-lang="' . hsc($jsonLang) . '" '
            . 'data-version="' . hsc(self::VERSION) . '">'
            . '<div class="dosnapshots-loading">' . hsc($this->getLang('title')) . '&hellip;</div>'
            . '</div>';

        // Include metrics container placeholder
        $renderer->doc .= '<div id="' . hsc($containerId) . '-metrics" class="dosnapshots-metrics-container" '
            . 'data-parent-id="' . hsc($containerId) . '"></div>';

        return true;
    }
}
