<?php
/**
 * Configuration metadata for dosnapshots plugin
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Claude (Anthropic)
 */

$meta['api_token']          = array('password');
$meta['default_droplet_id'] = array('string');
$meta['allow_restore']      = array('onoff');
$meta['allow_delete']       = array('onoff');
$meta['snapshot_prefix']    = array('string');
$meta['min_auth_level']     = array('multichoice', '_choices' => array('admin', 'manager', 'user'));
