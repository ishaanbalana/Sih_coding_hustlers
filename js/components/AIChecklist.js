/* ==========================================================================
   CRAFTORA - Clean AI Processing Checklist & Badge Component
   ========================================================================== */

import { renderIcon } from './Icons.js';

export function renderAIChecklist(isComplete = true) {
  return `
    <div style="background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: var(--radius-md); padding: 16px; margin: 16px 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 700; color: var(--copper); display: flex; align-items: center; gap: 6px;">
          ${renderIcon('sparkles', '', 16)} CRAFTORA AI Analysis
        </span>
        <span class="badge-pill badge-gold">AI-Assisted</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <div style="color: var(--success); display: flex; align-items: center; gap: 8px;">
          ${renderIcon('check', '', 14)} Craft category & technique identified
        </div>
        <div style="color: var(--success); display: flex; align-items: center; gap: 8px;">
          ${renderIcon('check', '', 14)} Image lighting & clarity enhanced
        </div>
        <div style="color: var(--success); display: flex; align-items: center; gap: 8px;">
          ${renderIcon('check', '', 14)} Product details & materials generated
        </div>
        <div style="color: var(--success); display: flex; align-items: center; gap: 8px;">
          ${renderIcon('check', '', 14)} Multilingual craft story draft created
        </div>
      </div>
    </div>
  `;
}
