<!-- inc/partials/modals/view_sale_metrics_modal.php -->
<div class="modal fade" id="viewMetricsModal" tabindex="-1" aria-labelledby="viewMetricsModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="viewMetricsModalLabel">Sale Metrics</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="metricsContent">
        <!-- Metrics details will be loaded here via AJAX -->
        <div class="text-center">
          <span class="spinner-border" role="status"></span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
