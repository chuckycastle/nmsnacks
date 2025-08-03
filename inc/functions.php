<?php
// inc/functions.php

if (!function_exists('sendResponse')) {
  function sendResponse($success, $data = [], $message = '') {
      header('Content-Type: application/json');
      echo json_encode([
          'success' => $success,
          'data' => $data,
          'message' => $message
      ]);
      exit;
  }
}
?>
