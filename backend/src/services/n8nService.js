const fetch = require("node-fetch");

const BASE_URL = process.env.N8N_WEBHOOK_BASE_URL;
const API_KEY = process.env.N8N_API_KEY;

/**
 * Triggers an n8n webhook workflow by name.
 * Each workflow in n8n should have a Webhook trigger node named to match `workflowPath`,
 * e.g. "order-confirmation", "abandoned-cart", "low-stock-alert", "shipping-update".
 *
 * This call is fire-and-forget from the API's perspective: failures are logged
 * but never block the primary business transaction (order creation, etc.).
 */
async function triggerWorkflow(workflowPath, payload) {
  if (!BASE_URL) {
    console.warn(`[n8n] N8N_WEBHOOK_BASE_URL not set, skipping workflow "${workflowPath}"`);
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/${workflowPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "X-N8N-Signature": API_KEY }),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[n8n] Workflow "${workflowPath}" responded with status ${res.status}`);
    }
  } catch (err) {
    console.error(`[n8n] Failed to trigger workflow "${workflowPath}":`, err.message);
  }
}

module.exports = {
  triggerWorkflow,
  // Convenience wrappers matching the workflows described in the proposal
  sendOrderConfirmation: (order) => triggerWorkflow("order-confirmation", order),
  sendShippingUpdate: (order) => triggerWorkflow("shipping-update", order),
  notifyLowStock: (product) => triggerWorkflow("low-stock-alert", product),
  sendAbandonedCartReminder: (cart) => triggerWorkflow("abandoned-cart", cart),
  sendFeedbackRequest: (order) => triggerWorkflow("feedback-request", order),
  sendPromotionalOffer: (payload) => triggerWorkflow("promotional-offer", payload),
};
