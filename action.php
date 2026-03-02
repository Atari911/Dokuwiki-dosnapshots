<?php
/**
 * AJAX handler for dosnapshots plugin
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */

class action_plugin_dosnapshots extends DokuWiki_Action_Plugin {

    /**
     * Register event handlers
     */
    public function register(Doku_Event_Handler $controller) {
        $controller->register_hook('AJAX_CALL_UNKNOWN', 'BEFORE', $this, 'handleAjax');
    }

    /**
     * Handle AJAX calls
     *
     * @param Doku_Event $event
     */
    public function handleAjax(Doku_Event $event) {
        if(strpos($event->data, 'plugin_dosnapshots_') !== 0) {
            return;
        }

        $event->preventDefault();
        $event->stopPropagation();

        header('Content-Type: application/json');

        /** @var helper_plugin_dosnapshots $helper */
        $helper = $this->loadHelper('dosnapshots');

        if(!$helper->isConfigured()) {
            $this->sendError($this->getLang('no_token'));
            return;
        }

        if(!$helper->userHasAccess()) {
            $this->sendError($this->getLang('no_permission'));
            return;
        }

        // CSRF protection
        global $INPUT;
        if(!checkSecurityToken()) {
            $this->sendError($this->getLang('err_csrf'));
            return;
        }

        $dropletId = $INPUT->str('droplet_id');
        if(empty($dropletId) || !ctype_digit($dropletId)) {
            $this->sendError($this->getLang('err_invalid_droplet_id'));
            return;
        }

        $action = str_replace('plugin_dosnapshots_', '', $event->data);

        switch($action) {
            case 'info':
                $this->handleInfo($helper, $dropletId);
                break;
            case 'list':
                $this->handleList($helper, $dropletId);
                break;
            case 'create':
                $this->handleCreate($helper, $dropletId);
                break;
            case 'delete':
                $this->handleDelete($helper);
                break;
            case 'restore':
                $this->handleRestore($helper, $dropletId);
                break;
            case 'power_off':
                $this->handlePowerOff($helper, $dropletId);
                break;
            case 'power_on':
                $this->handlePowerOn($helper, $dropletId);
                break;
            case 'reboot':
                $this->handleReboot($helper, $dropletId);
                break;
            case 'action_status':
                $this->handleActionStatus($helper, $dropletId);
                break;
            case 'metrics':
                $this->handleMetrics($helper, $dropletId);
                break;
            default:
                $this->sendError('Unknown action');
        }
    }

    /**
     * Get droplet info
     */
    protected function handleInfo($helper, $dropletId) {
        $result = $helper->getDroplet($dropletId);
        if($result['success']) {
            $this->sendSuccess($result['data']);
        } else {
            $this->sendError(sprintf($this->getLang('err_api_failed'), $result['error']));
        }
    }

    /**
     * List snapshots
     */
    protected function handleList($helper, $dropletId) {
        $result = $helper->getDropletSnapshots($dropletId);
        if($result['success']) {
            $this->sendSuccess($result['data']);
        } else {
            $this->sendError(sprintf($this->getLang('err_api_failed'), $result['error']));
        }
    }

    /**
     * Create a snapshot
     */
    protected function handleCreate($helper, $dropletId) {
        global $INPUT;
        $name = $INPUT->str('snapshot_name');
        if(empty($name)) {
            $prefix = $this->getConf('snapshot_prefix');
            $name = $prefix . date('Y-m-d-His');
        }
        // Sanitize name: allow alphanumeric, dashes, underscores, dots
        $name = preg_replace('/[^a-zA-Z0-9\-_.]/', '-', $name);

        $result = $helper->createSnapshot($dropletId, $name);
        if($result['success']) {
            $this->sendSuccess($result['data'], $this->getLang('msg_snapshot_created'));
        } else {
            $this->sendError(sprintf($this->getLang('err_create_failed'), $result['error']));
        }
    }

    /**
     * Delete a snapshot
     */
    protected function handleDelete($helper) {
        if(!$this->getConf('allow_delete')) {
            $this->sendError($this->getLang('err_delete_disabled'));
            return;
        }

        global $INPUT;
        $snapshotId = $INPUT->str('snapshot_id');
        if(empty($snapshotId) || !ctype_digit($snapshotId)) {
            $this->sendError($this->getLang('err_invalid_droplet_id'));
            return;
        }

        $result = $helper->deleteSnapshot($snapshotId);
        if($result['success']) {
            $snapshotName = $INPUT->str('snapshot_name', $snapshotId);
            $this->sendSuccess(null, sprintf($this->getLang('msg_snapshot_deleted'), hsc($snapshotName)));
        } else {
            $this->sendError(sprintf($this->getLang('err_delete_failed'), $result['error']));
        }
    }

    /**
     * Restore from snapshot
     */
    protected function handleRestore($helper, $dropletId) {
        if(!$this->getConf('allow_restore')) {
            $this->sendError($this->getLang('err_restore_disabled'));
            return;
        }

        global $INPUT;
        $snapshotId = $INPUT->str('snapshot_id');
        if(empty($snapshotId) || !ctype_digit($snapshotId)) {
            $this->sendError($this->getLang('err_invalid_droplet_id'));
            return;
        }

        $result = $helper->restoreFromSnapshot($dropletId, $snapshotId);
        if($result['success']) {
            $snapshotName = $INPUT->str('snapshot_name', $snapshotId);
            $this->sendSuccess($result['data'], sprintf($this->getLang('msg_restore_started'), hsc($snapshotName)));
        } else {
            $this->sendError(sprintf($this->getLang('err_restore_failed'), $result['error']));
        }
    }

    /**
     * Power off droplet
     */
    protected function handlePowerOff($helper, $dropletId) {
        $result = $helper->powerOff($dropletId);
        if($result['success']) {
            $this->sendSuccess($result['data'], $this->getLang('msg_power_off_started'));
        } else {
            $this->sendError(sprintf($this->getLang('err_power_failed'), $result['error']));
        }
    }

    /**
     * Power on droplet
     */
    protected function handlePowerOn($helper, $dropletId) {
        $result = $helper->powerOn($dropletId);
        if($result['success']) {
            $this->sendSuccess($result['data'], $this->getLang('msg_power_on_started'));
        } else {
            $this->sendError(sprintf($this->getLang('err_power_failed'), $result['error']));
        }
    }

    /**
     * Reboot droplet
     */
    protected function handleReboot($helper, $dropletId) {
        $result = $helper->reboot($dropletId);
        if($result['success']) {
            $this->sendSuccess($result['data'], $this->getLang('msg_reboot_started'));
        } else {
            $this->sendError(sprintf($this->getLang('err_power_failed'), $result['error']));
        }
    }

    /**
     * Check action status
     */
    protected function handleActionStatus($helper, $dropletId) {
        global $INPUT;
        $actionId = $INPUT->str('action_id');
        $result = $helper->getAction($dropletId, $actionId);
        if($result['success']) {
            $this->sendSuccess($result['data']);
        } else {
            $this->sendError(sprintf($this->getLang('err_api_failed'), $result['error']));
        }
    }

    /**
     * Fetch metrics data (aggregated)
     */
    protected function handleMetrics($helper, $dropletId) {
        global $INPUT;
        $metric = $INPUT->str('metric');
        $hours  = $INPUT->int('hours', 6);

        // Validate timeframe
        $allowedHours = array(6, 24, 168, 336);
        if(!in_array($hours, $allowedHours)) $hours = 6;

        $end   = time();
        $start = $end - ($hours * 3600);

        $data = array();

        switch($metric) {
            case 'cpu':
                $result = $helper->getMetricsCpu($dropletId, $start, $end);
                $data = $result['success'] ? $result['data'] : null;
                break;

            case 'memory':
                $free  = $helper->getMetricsMemoryFree($dropletId, $start, $end);
                $total = $helper->getMetricsMemoryTotal($dropletId, $start, $end);
                $data = array(
                    'free'  => $free['success'] ? $free['data'] : null,
                    'total' => $total['success'] ? $total['data'] : null,
                );
                break;

            case 'bandwidth':
                $pubIn  = $helper->getMetricsBandwidth($dropletId, $start, $end, 'public', 'inbound');
                $pubOut = $helper->getMetricsBandwidth($dropletId, $start, $end, 'public', 'outbound');
                $data = array(
                    'inbound'  => $pubIn['success'] ? $pubIn['data'] : null,
                    'outbound' => $pubOut['success'] ? $pubOut['data'] : null,
                );
                break;

            case 'filesystem':
                $free = $helper->getMetricsFilesystemFree($dropletId, $start, $end);
                $size = $helper->getMetricsFilesystemSize($dropletId, $start, $end);
                $data = array(
                    'free' => $free['success'] ? $free['data'] : null,
                    'size' => $size['success'] ? $size['data'] : null,
                );
                break;

            case 'load':
                $l1  = $helper->getMetricsLoad($dropletId, $start, $end, 1);
                $l5  = $helper->getMetricsLoad($dropletId, $start, $end, 5);
                $l15 = $helper->getMetricsLoad($dropletId, $start, $end, 15);
                $data = array(
                    'load1'  => $l1['success'] ? $l1['data'] : null,
                    'load5'  => $l5['success'] ? $l5['data'] : null,
                    'load15' => $l15['success'] ? $l15['data'] : null,
                );
                break;

            default:
                $this->sendError('Unknown metric type');
                return;
        }

        if($data === null) {
            $this->sendError($this->getLang('metrics_no_data'));
        } else {
            $this->sendSuccess(array('metric' => $metric, 'hours' => $hours, 'data' => $data));
        }
    }

    /**
     * Send a JSON success response
     */
    protected function sendSuccess($data, $message = '') {
        echo json_encode(array(
            'success' => true,
            'data'    => $data,
            'message' => $message,
        ));
    }

    /**
     * Send a JSON error response
     */
    protected function sendError($message) {
        echo json_encode(array(
            'success' => false,
            'error'   => $message,
        ));
    }
}
