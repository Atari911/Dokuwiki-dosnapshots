<?php
/**
 * English language file for dosnapshots plugin
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */

// Menu entry for admin page
$lang['menu'] = 'Digital Ocean Snapshots';

// Admin config settings
$lang['api_token']           = 'Digital Ocean API Token';
$lang['default_droplet_id']  = 'Default Droplet ID';
$lang['allow_restore']       = 'Allow snapshot restore (rebuilds droplet)';
$lang['allow_delete']        = 'Allow snapshot deletion';
$lang['snapshot_prefix']     = 'Prefix for snapshot names';

// UI strings
$lang['title']               = 'Digital Ocean Snapshot Manager';
$lang['droplet_info']        = 'Droplet Information';
$lang['droplet_name']        = 'Droplet Name';
$lang['droplet_status']      = 'Status';
$lang['droplet_ip']          = 'IP Address';
$lang['droplet_region']      = 'Region';
$lang['droplet_image']       = 'Image';
$lang['droplet_size']        = 'Size';
$lang['droplet_created']     = 'Created';

$lang['snapshots']           = 'Snapshots';
$lang['snapshot_name']       = 'Snapshot Name';
$lang['snapshot_id']         = 'ID';
$lang['snapshot_size']       = 'Size (GB)';
$lang['snapshot_created']    = 'Created At';
$lang['snapshot_regions']    = 'Regions';
$lang['snapshot_min_disk']   = 'Min Disk (GB)';

$lang['actions']             = 'Actions';
$lang['btn_refresh']         = 'Refresh';
$lang['btn_create']          = 'Create Snapshot';
$lang['btn_restore']         = 'Restore';
$lang['btn_delete']          = 'Delete';
$lang['btn_power_off']       = 'Power Off Droplet';
$lang['btn_power_on']        = 'Power On Droplet';
$lang['btn_reboot']          = 'Reboot Droplet';
$lang['btn_console']         = 'Open Console';

$lang['create_snapshot']     = 'Create New Snapshot';
$lang['snapshot_name_label'] = 'Snapshot Name';
$lang['snapshot_name_hint']  = 'Leave blank for auto-generated name';

$lang['no_snapshots']        = 'No snapshots found for this droplet.';
$lang['no_token']            = 'Digital Ocean API token not configured. Please configure it in the admin settings.';
$lang['no_droplet']          = 'No droplet ID specified. Set a default in admin settings or use the droplet_id parameter.';
$lang['no_permission']       = 'You do not have permission to manage snapshots.';

// Confirmation messages
$lang['confirm_delete']      = 'Are you sure you want to permanently delete snapshot "%s"? This cannot be undone.';
$lang['confirm_restore']     = 'Are you sure you want to restore droplet from snapshot "%s"? This will REBUILD the droplet and destroy all current data!';
$lang['confirm_power_off']   = 'Are you sure you want to power off this droplet?';
$lang['confirm_reboot']      = 'Are you sure you want to reboot this droplet?';

// Status/result messages
$lang['msg_snapshot_created']    = 'Snapshot creation initiated. It may take several minutes to complete.';
$lang['msg_snapshot_deleted']    = 'Snapshot "%s" has been deleted.';
$lang['msg_restore_started']     = 'Droplet restore from snapshot "%s" has been initiated. The droplet will reboot.';
$lang['msg_power_off_started']   = 'Droplet power off initiated.';
$lang['msg_power_on_started']    = 'Droplet power on initiated.';
$lang['msg_reboot_started']      = 'Droplet reboot initiated.';
$lang['msg_action_pending']      = 'Action is in progress...';
$lang['msg_action_complete']     = 'Action completed successfully.';

// Error messages
$lang['err_api_failed']          = 'API request failed: %s';
$lang['err_create_failed']       = 'Failed to create snapshot: %s';
$lang['err_delete_failed']       = 'Failed to delete snapshot: %s';
$lang['err_restore_failed']      = 'Failed to restore from snapshot: %s';
$lang['err_power_failed']        = 'Failed to change power state: %s';
$lang['err_droplet_not_found']   = 'Droplet not found or not accessible.';
$lang['err_invalid_droplet_id']  = 'Invalid droplet ID provided.';
$lang['err_restore_disabled']    = 'Snapshot restore is disabled by the administrator.';
$lang['err_delete_disabled']     = 'Snapshot deletion is disabled by the administrator.';
$lang['err_csrf']                = 'Security token mismatch. Please try again.';

// Syntax plugin help
$lang['syntax_help']         = 'Usage: {{dosnapshots>[droplet_id]}} — Embed snapshot manager for a specific droplet.';

// Metrics / Graphs
$lang['metrics']             = 'Metrics';
$lang['metrics_show']        = 'Show Metrics';
$lang['metrics_hide']        = 'Hide Metrics';
$lang['metrics_timeframe']   = 'Timeframe';
$lang['metrics_6h']          = '6 Hours';
$lang['metrics_24h']         = '24 Hours';
$lang['metrics_7d']          = '7 Days';
$lang['metrics_14d']         = '14 Days';
$lang['metric_cpu']          = 'CPU Usage';
$lang['metric_memory']       = 'Memory Usage';
$lang['metric_disk_io']      = 'Disk I/O';
$lang['metric_bandwidth']    = 'Bandwidth';
$lang['metric_load']         = 'Load Average';
$lang['metric_filesystem']   = 'Disk Usage';
$lang['metrics_percent']     = '%';
$lang['metrics_mbps']        = 'MB/s';
$lang['metrics_read']        = 'Read';
$lang['metrics_write']       = 'Write';
$lang['metrics_inbound']     = 'In';
$lang['metrics_outbound']    = 'Out';
$lang['metrics_load1']       = '1m';
$lang['metrics_load5']       = '5m';
$lang['metrics_load15']      = '15m';
$lang['metrics_no_data']     = 'No metrics data available. Is the DO metrics agent installed?';
$lang['metrics_note']        = 'Memory, load average, and disk usage require the DigitalOcean metrics agent.';

// Version
$lang['version']             = 'Version';
