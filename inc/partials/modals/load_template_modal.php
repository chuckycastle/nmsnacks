<?php
// inc/partials/modals/load_template_modal.php
// Assume $templates is an array of available templates.
?>
<div class="modal fade" id="loadTemplateModal" tabindex="-1" aria-labelledby="loadTemplateModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="loadTemplateForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="loadTemplateModalLabel">Load Template for Restock</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <label for="templateSelect" class="form-label">Select a Template:</label>
          <select class="form-select" id="templateSelect" name="template_id" required>
            <option value="">Select Template</option>
            <?php foreach ($templates as $temp): ?>
              <option value="<?php echo htmlspecialchars($temp['template_id']); ?>">
                <?php echo htmlspecialchars($temp['name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Load Template</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
<script>
// The submission for loading a template should be handled via AJAX in inventory.js.
</script>
