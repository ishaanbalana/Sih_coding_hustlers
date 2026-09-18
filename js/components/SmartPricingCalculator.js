/* ==========================================================================
   CRAFTORA - Clean Smart Pricing Engine Component
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

export function renderSmartPricingCalculator(product) {
  const breakdown = product.costBreakdown || {
    materialCost: 180,
    labourCost: 250,
    productionTimeDays: 2,
    packagingCost: 40,
    totalEstimatedCost: 470
  };

  const matCost = breakdown.materialCost;
  const labCost = breakdown.labourCost;
  const packCost = breakdown.packagingCost;
  const totalCost = matCost + labCost + packCost;
  const sellingPrice = product.price || 680;
  const profitMargin = sellingPrice - totalCost;
  const marginPercent = totalCost > 0 ? Math.round((profitMargin / totalCost) * 100) : 0;

  return `
    <div class="craft-card craft-card-glow">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
          ${renderIcon('rupee', '', 18)} Smart Pricing Breakdown
        </h3>
        <span class="badge-pill badge-gold">AI Indicative Price Recommendation</span>
      </div>

      <!-- Cost Itemization Form -->
      <div style="background: var(--bg-elevated); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px;">
          Your Entered Cost Itemization
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
          <div>
            <label style="font-size: 11px; color: var(--text-muted);">Material Cost (₹)</label>
            <input type="number" id="cost_mat" class="form-input" value="${matCost}" onchange="window.recalculatePricing('${product.id}')" style="padding: 8px 10px; font-size: 14px;">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted);">Labour Cost (₹)</label>
            <input type="number" id="cost_lab" class="form-input" value="${labCost}" onchange="window.recalculatePricing('${product.id}')" style="padding: 8px 10px; font-size: 14px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; color: var(--text-muted);">Production Time (Days)</label>
            <input type="number" id="cost_time" class="form-input" value="${breakdown.productionTimeDays}" style="padding: 8px 10px; font-size: 14px;">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted);">Packaging (₹)</label>
            <input type="number" id="cost_pack" class="form-input" value="${packCost}" onchange="window.recalculatePricing('${product.id}')" style="padding: 8px 10px; font-size: 14px;">
          </div>
        </div>

        <div style="border-top: 1px dashed var(--border-medium); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--text-secondary); font-size: 13px;">Total Estimated Cost:</strong>
          <strong style="color: var(--copper); font-size: 17px;">₹${totalCost}</strong>
        </div>
      </div>

      <!-- Sample Market Data -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-copper); display: flex; align-items: center; gap: 6px;">
            ${renderIcon('tag', '', 14)} Sample Market Data
          </div>
          <span class="badge-pill badge-gold">AI-Assisted</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span>Sample Market Demand</span>
          <span class="badge-pill badge-emerald">High</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span>Similar Crafts Price Range</span>
          <strong>₹550 – ₹750</strong>
        </div>
      </div>

      <!-- AI Recommended Price & Manual Adjustment Input -->
      <div style="text-align: center; padding: 16px; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-green); margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
          ✨ AI Indicative Recommended Selling Price
        </div>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 22px; font-weight: 800; color: var(--copper);">₹</span>
          <input type="number" id="final_selling_price" class="form-input" value="${sellingPrice}" onchange="window.recalculatePricing('${product.id}')" style="width: 130px; text-align: center; font-size: 22px; font-weight: 800; color: var(--copper); padding: 4px 8px; border-color: var(--text-copper);">
        </div>

        <div style="font-size: 12px; color: ${profitMargin >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
          Estimated Artisan Profit: ₹${profitMargin} (${marginPercent}% margin over costs)
        </div>
      </div>

      <div class="disclaimer-box">
        <span>${renderIcon('alertCircle', '', 16)}</span>
        <div>
          <strong>Data & Pricing Disclaimer:</strong><br>
          Based on entered costs and sample market benchmark data. AI Indicative recommendation with full artisan price override control.
        </div>
      </div>
    </div>
  `;
}

window.recalculatePricing = (productId) => {
  const matCost = parseFloat(document.getElementById('cost_mat')?.value || 180);
  const labCost = parseFloat(document.getElementById('cost_lab')?.value || 250);
  const timeDays = parseInt(document.getElementById('cost_time')?.value || 2);
  const packCost = parseFloat(document.getElementById('cost_pack')?.value || 40);
  const sellingPrice = parseFloat(document.getElementById('final_selling_price')?.value || 680);

  const updatedCostBreakdown = {
    materialCost: matCost,
    labourCost: labCost,
    productionTimeDays: timeDays,
    packagingCost: packCost,
    totalEstimatedCost: matCost + labCost + packCost
  };

  appState.updateProduct({
    id: productId,
    price: sellingPrice,
    costBreakdown: updatedCostBreakdown
  });
};
