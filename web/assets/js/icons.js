// Per-category chunky filled silhouettes (cartoon / Pokémon-card vibe).
// Designed to render white-on-colour on the card banner.
window.ICONS = {
  Tree: `<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="24" cy="18" r="13"/><circle cx="14" cy="22" r="8"/><circle cx="34" cy="22" r="8"/><rect x="20" y="26" width="8" height="16" rx="1.5"/><rect x="14" y="40" width="20" height="4" rx="1.5"/></svg>`,
  Shrub: `<svg viewBox="0 0 48 48" fill="currentColor"><ellipse cx="14" cy="28" rx="9" ry="10"/><ellipse cx="34" cy="28" rx="9" ry="10"/><ellipse cx="24" cy="22" rx="11" ry="11"/><rect x="6" y="36" width="36" height="4" rx="1.5"/></svg>`,
  Herb: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="22" y="22" width="4" height="20" rx="2"/><ellipse cx="14" cy="20" rx="9" ry="5" transform="rotate(-30 14 20)"/><ellipse cx="34" cy="20" rx="9" ry="5" transform="rotate(30 34 20)"/><ellipse cx="24" cy="11" rx="7" ry="5"/><rect x="14" y="40" width="20" height="3" rx="1.5"/></svg>`,
  Succulent: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="20" y="8" width="8" height="34" rx="4"/><rect x="8" y="20" width="14" height="6" rx="3"/><rect x="26" y="14" width="14" height="6" rx="3"/><rect x="14" y="40" width="20" height="3" rx="1.5"/></svg>`,
  Grass: `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M10 42 Q9 26 14 14 L18 14 Q15 28 14 42 Z"/><path d="M19 42 Q18 22 24 8 L28 8 Q24 24 23 42 Z"/><path d="M28 42 Q27 24 33 12 L37 12 Q33 26 32 42 Z"/><rect x="6" y="40" width="36" height="3" rx="1.5"/></svg>`,
  Fern: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="22" y="20" width="4" height="22" rx="2" transform="rotate(-15 24 31)"/><ellipse cx="32" cy="12" rx="5" ry="3" transform="rotate(-45 32 12)"/><ellipse cx="28" cy="18" rx="5" ry="3" transform="rotate(-45 28 18)"/><ellipse cx="24" cy="24" rx="5" ry="3" transform="rotate(-45 24 24)"/><ellipse cx="20" cy="30" rx="5" ry="3" transform="rotate(-45 20 30)"/><rect x="14" y="40" width="20" height="3" rx="1.5"/></svg>`,
  Climber: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="11" y="6" width="4" height="36" rx="2"/><ellipse cx="22" cy="11" rx="7" ry="4" transform="rotate(20 22 11)"/><ellipse cx="24" cy="22" rx="7" ry="4" transform="rotate(-20 24 22)"/><ellipse cx="22" cy="33" rx="7" ry="4" transform="rotate(20 22 33)"/><rect x="4" y="40" width="22" height="3" rx="1.5"/></svg>`,
  Conifer: `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 6 L13 22 L18 22 L10 33 L16 33 L7 43 L41 43 L32 33 L38 33 L30 22 L35 22 Z"/><rect x="22" y="40" width="4" height="4"/></svg>`,
};
window.DEFAULT_ICON = `<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="24" cy="24" r="10"/></svg>`;
window.iconFor = (cat) => window.ICONS[cat] || window.DEFAULT_ICON;
