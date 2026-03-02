<?php
/**
 * Digital Ocean API v2 helper for dosnapshots plugin
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */

class helper_plugin_dosnapshots extends DokuWiki_Plugin {

    const API_BASE = 'https://api.digitalocean.com/v2';
    const VERSION  = '1.4.0';

    /** @var string */
    protected $token;

    /**
     * Constructor — loads API token from config
     */
    public function __construct() {
        $this->token = $this->getConf('api_token');
    }

    /**
     * Return plugin version
     * @return string
     */
    public function getVersion() {
        return self::VERSION;
    }

    /**
     * Check if the current user has sufficient permissions
     * @return bool
     */
    public function userHasAccess() {
        global $INFO;
        $level = $this->getConf('min_auth_level');
        switch($level) {
            case 'user':
                return isset($INFO['userinfo']);
            case 'manager':
                return auth_ismanager();
            case 'admin':
            default:
                return auth_isadmin();
        }
    }

    /**
     * Check if the API token is configured
     * @return bool
     */
    public function isConfigured() {
        return !empty($this->token);
    }

    /**
     * Make an API request to Digital Ocean
     *
     * @param string $endpoint API endpoint (relative to base URL)
     * @param string $method   HTTP method
     * @param array  $data     POST/PUT data
     * @return array ['success' => bool, 'data' => mixed, 'error' => string]
     */
    protected function apiRequest($endpoint, $method = 'GET', $data = null) {
        $url = self::API_BASE . $endpoint;

        $headers = array(
            'Authorization: Bearer ' . $this->token,
            'Content-Type: application/json',
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        switch(strtoupper($method)) {
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                if($data !== null) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                if($data !== null) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if($error) {
            return array('success' => false, 'data' => null, 'error' => $error);
        }

        $decoded = json_decode($response, true);

        if($httpCode >= 200 && $httpCode < 300) {
            return array('success' => true, 'data' => $decoded, 'error' => null);
        }

        $errMsg = isset($decoded['message']) ? $decoded['message'] : "HTTP $httpCode";
        return array('success' => false, 'data' => $decoded, 'error' => $errMsg);
    }

    /**
     * Get droplet information
     *
     * @param string $dropletId
     * @return array
     */
    public function getDroplet($dropletId) {
        return $this->apiRequest("/droplets/$dropletId");
    }

    /**
     * Get all snapshots for a droplet
     *
     * @param string $dropletId
     * @return array
     */
    public function getDropletSnapshots($dropletId) {
        return $this->apiRequest("/droplets/$dropletId/snapshots?per_page=100");
    }

    /**
     * Create a snapshot of a droplet
     *
     * @param string $dropletId
     * @param string $name Snapshot name
     * @return array
     */
    public function createSnapshot($dropletId, $name) {
        $data = array(
            'type' => 'snapshot',
            'name' => $name,
        );
        return $this->apiRequest("/droplets/$dropletId/actions", 'POST', $data);
    }

    /**
     * Delete a snapshot
     *
     * @param string $snapshotId
     * @return array
     */
    public function deleteSnapshot($snapshotId) {
        return $this->apiRequest("/snapshots/$snapshotId", 'DELETE');
    }

    /**
     * Restore (rebuild) a droplet from a snapshot
     *
     * @param string $dropletId
     * @param string $snapshotId
     * @return array
     */
    public function restoreFromSnapshot($dropletId, $snapshotId) {
        $data = array(
            'type'  => 'rebuild',
            'image' => (int)$snapshotId,
        );
        return $this->apiRequest("/droplets/$dropletId/actions", 'POST', $data);
    }

    /**
     * Power off a droplet
     *
     * @param string $dropletId
     * @return array
     */
    public function powerOff($dropletId) {
        $data = array('type' => 'power_off');
        return $this->apiRequest("/droplets/$dropletId/actions", 'POST', $data);
    }

    /**
     * Power on a droplet
     *
     * @param string $dropletId
     * @return array
     */
    public function powerOn($dropletId) {
        $data = array('type' => 'power_on');
        return $this->apiRequest("/droplets/$dropletId/actions", 'POST', $data);
    }

    /**
     * Reboot a droplet
     *
     * @param string $dropletId
     * @return array
     */
    public function reboot($dropletId) {
        $data = array('type' => 'reboot');
        return $this->apiRequest("/droplets/$dropletId/actions", 'POST', $data);
    }

    /**
     * Get the status of an action
     *
     * @param string $dropletId
     * @param string $actionId
     * @return array
     */
    public function getAction($dropletId, $actionId) {
        return $this->apiRequest("/droplets/$dropletId/actions/$actionId");
    }

    /**
     * Get CPU metrics for a droplet
     *
     * @param string $dropletId
     * @param int    $start Unix timestamp
     * @param int    $end   Unix timestamp
     * @return array
     */
    public function getMetricsCpu($dropletId, $start, $end) {
        return $this->apiRequest("/monitoring/metrics/droplet/cpu?host_id=$dropletId&start=$start&end=$end");
    }

    /**
     * Get memory (free) metrics for a droplet (requires do-agent)
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @return array
     */
    public function getMetricsMemoryFree($dropletId, $start, $end) {
        return $this->apiRequest("/monitoring/metrics/droplet/memory_free?host_id=$dropletId&start=$start&end=$end");
    }

    /**
     * Get memory (total) metrics for a droplet (requires do-agent)
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @return array
     */
    public function getMetricsMemoryTotal($dropletId, $start, $end) {
        return $this->apiRequest("/monitoring/metrics/droplet/memory_total?host_id=$dropletId&start=$start&end=$end");
    }

    /**
     * Get bandwidth metrics for a droplet
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @param string $interface  public or private
     * @param string $direction  inbound or outbound
     * @return array
     */
    public function getMetricsBandwidth($dropletId, $start, $end, $interface = 'public', $direction = 'inbound') {
        return $this->apiRequest("/monitoring/metrics/droplet/bandwidth?host_id=$dropletId&start=$start&end=$end&interface=$interface&direction=$direction");
    }

    /**
     * Get filesystem (disk usage) metrics (requires do-agent)
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @return array
     */
    public function getMetricsFilesystemFree($dropletId, $start, $end) {
        return $this->apiRequest("/monitoring/metrics/droplet/filesystem_free?host_id=$dropletId&start=$start&end=$end");
    }

    /**
     * Get filesystem size metrics (requires do-agent)
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @return array
     */
    public function getMetricsFilesystemSize($dropletId, $start, $end) {
        return $this->apiRequest("/monitoring/metrics/droplet/filesystem_size?host_id=$dropletId&start=$start&end=$end");
    }

    /**
     * Get load average metrics (requires do-agent)
     *
     * @param string $dropletId
     * @param int    $start
     * @param int    $end
     * @param int    $minutes  1, 5, or 15
     * @return array
     */
    public function getMetricsLoad($dropletId, $start, $end, $minutes = 1) {
        $endpoint = "/monitoring/metrics/droplet/load_$minutes?host_id=$dropletId&start=$start&end=$end";
        return $this->apiRequest($endpoint);
    }
}
