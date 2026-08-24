import {GUI_MISTY_SAND, Theme} from '.';
import {getCurrent} from './customTheme';
import AddonHooks from '../../addons/hooks';
import './global-styles.css';

const MISTY_SAND_DEFAULT_CSS = `html.tw-misty-sand-theme {
  background: linear-gradient(135deg, #e9f1fb 0%, #f7f1e8 48%, #eef5f0 100%) fixed;
}
html.tw-misty-sand-theme body {
  background: transparent !important;
}
html.tw-misty-sand-theme [class*="gui_gui_"],
html.tw-misty-sand-theme [class*="gui_body-wrapper_"] {
  background: transparent !important;
}

html.tw-misty-sand-theme .blocklyToolboxDiv,
html.tw-misty-sand-theme [class*="sprite-selector_sprite-selector_"],
html.tw-misty-sand-theme [class*="selector_wrapper_"],
html.tw-misty-sand-theme [class*="gui_tab_"] {
  background: rgba(255, 255, 255, 0.42) !important;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 30px rgba(40, 60, 90, 0.12);
}

html.tw-misty-sand-theme .blocklyTreeRow {
  background: rgba(255, 255, 255, 0.45) !important;
  border-radius: var(--cyso-radius-md);
}

html.tw-misty-sand-theme .scratchCategoryMenu,
html.tw-misty-sand-theme .scratchCategoryMenuRow {
  background: transparent !important;
}

html.tw-misty-sand-theme .scratchCategoryMenuItem {
  background: rgba(255, 255, 255, 0.45) !important;
  border-radius: var(--cyso-radius-md);
}
html.tw-misty-sand-theme .scratchCategoryMenuItem:hover,
html.tw-misty-sand-theme .scratchCategoryMenuItem.selected {
  background: rgba(255, 255, 255, 0.62) !important;
}

html.tw-misty-sand-theme .blocklySvg {
  background: rgba(255, 255, 255, 0.32) !important;
}
html.tw-misty-sand-theme .blocklyMainBackground { fill: transparent !important; }

html.tw-misty-sand-theme [class*="menu-bar_menu-bar_"] {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

html.tw-misty-sand-theme [class*="green-flag_green-flag_"],
html.tw-misty-sand-theme [class*="stop-all_stop-all_"] {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.55);
}
html.tw-misty-sand-theme [class*="extension-button-container"] {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(9px) saturate(150%);
  -webkit-backdrop-filter: blur(9px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.55);
}

html.tw-misty-sand-theme [class*="menu_menu_"],
html.tw-misty-sand-theme [class*="menu_submenu_"] [class*="menu_menu_"],
html.tw-misty-sand-theme [class*="modal_modal-content_"] {
  background: rgba(255, 255, 255, 0.82) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
  box-shadow: 0 12px 40px rgba(40, 60, 90, 0.22);
}
html.tw-misty-sand-theme [class*="menu_submenu_"] { background: transparent !important; }

html.tw-misty-sand-theme [class*="settings-modal_body_"],
html.tw-misty-sand-theme [class*="library_library-scroll-grid_"] {
  background: transparent !important;
}

html.tw-misty-sand-theme.tw-custom-bg-perf .blocklyToolboxDiv,
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="sprite-selector_sprite-selector_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="selector_wrapper_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="gui_tab_"],
html.tw-misty-sand-theme.tw-custom-bg-perf .blocklyTreeRow,
html.tw-misty-sand-theme.tw-custom-bg-perf .scratchCategoryMenuItem,
html.tw-misty-sand-theme.tw-custom-bg-perf .blocklySvg,
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="green-flag_green-flag_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="stop-all_stop-all_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="extension-button-container"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="settings-modal_body_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="library_library-scroll-grid_"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: rgba(255, 255, 255, 0.55) !important;
}
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="menu_menu_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="modal_modal-content_"] {
  backdrop-filter: blur(16px) saturate(155%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(155%) !important;
  background: rgba(255, 255, 255, 0.82) !important;
}
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="gui_gui_"],
html.tw-misty-sand-theme.tw-custom-bg-perf [class*="gui_body-wrapper_"] {
  background: transparent !important;
}
html.tw-misty-sand-theme [class*="menu-bar_menu-bar-item_"] {
  font-weight: 600;
}
html.tw-misty-sand-theme:not(.tw-misty-sand-dark) [class*="extension-button-icon"] {
  filter: grayscale(100%) brightness(0.4) !important;
}
html.tw-misty-sand-theme [class*="stage-header_stage-button_"] {
  color: #2b3340 !important;
}
html.tw-misty-sand-theme [class*="stage-header_stage-button-icon_"] {
  filter: grayscale(100%) contrast(1.5) brightness(0.95) !important;
}
`;

const MISTY_SAND_DARK_CSS = `html.tw-misty-sand-theme.tw-misty-sand-dark {
  background: linear-gradient(135deg, #1a1c24 0%, #212127 48%, #1c1e24 100%) fixed;
  --color-scheme: dark !important;
  --ui-primary: #23242b !important;
  --ui-secondary: #2a2c34 !important;
  --ui-tertiary: #34363f !important;
  --ui-modal-overlay: rgba(10, 10, 15, 0.65) !important;
  --ui-modal-background: rgba(38, 39, 48, 0.92) !important;
  --ui-modal-foreground: #e8e9ee !important;
  --ui-modal-header-foreground: #e8e9ee !important;
  --ui-white: rgba(255, 255, 255, 0.08) !important;
  --ui-white-dim: rgba(255, 255, 255, 0.06) !important;
  --ui-white-transparent: rgba(255, 255, 255, 0.03) !important;
  --ui-transparent: transparent !important;
  --ui-black-transparent: rgba(0, 0, 0, 0.35) !important;
  --text-primary: #e8e9ee !important;
  --text-primary-transparent: rgba(232, 233, 238, 0.88) !important;
  --menu-bar-background: rgba(28, 29, 36, 0.6) !important;
  --menu-bar-foreground: #e8e9ee !important;
  --assets-background: rgba(30, 32, 40, 0.55) !important;
  --input-background: rgba(42, 44, 54, 0.7) !important;
  --popover-background: rgba(36, 37, 46, 0.92) !important;
  --shadow: rgba(0, 0, 0, 0.45) !important;
  --badge-background: #2b3348 !important;
  --badge-border: #3d4a66 !important;
  --fullscreen-background: rgba(20, 21, 28, 0.9) !important;
  --fullscreen-accent: #2a2d3a !important;
  --page-background: #1c1d24 !important;
  --page-foreground: #e8e9ee !important;
  --project-title-inactive: rgba(255, 255, 255, 0.3) !important;
  --project-title-hover: rgba(255, 255, 255, 0.7) !important;
  --link-color: #7db3f5 !important;
  --filter-icon-black: invert(100%) !important;
  --filter-icon-gray: grayscale(100%) brightness(1.7) !important;
  --filter-icon-white: none !important;
  --paint-ui-pane-border: rgba(255, 255, 255, 0.12) !important;
  --paint-text-primary: #e8e9ee !important;
  --paint-form-border: rgba(255, 255, 255, 0.12) !important;
  --paint-filter-icon-gray: brightness(1.7) !important;
  --drop-highlight: #5b9ef0 !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark body {
  background: transparent !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="gui_gui_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="gui_body-wrapper_"] {
  background: transparent !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyToolboxDiv,
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="sprite-selector_sprite-selector_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="selector_wrapper_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="gui_tab_"] {
  background: rgba(30, 32, 42, 0.55) !important;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  color: #e8e9ee;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyTreeRow {
  background: rgba(30, 32, 42, 0.5) !important;
  border-radius: var(--cyso-radius-md);
  color: #cccccc;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .scratchCategoryMenu,
html.tw-misty-sand-theme.tw-misty-sand-dark .scratchCategoryMenuRow {
  background: transparent !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .scratchCategoryMenuItem {
  background: rgba(30, 32, 42, 0.5) !important;
  border-radius: var(--cyso-radius-md);
  color: #cccccc;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .scratchCategoryMenuItem:hover,
html.tw-misty-sand-theme.tw-misty-sand-dark .scratchCategoryMenuItem.selected {
  background: rgba(46, 49, 62, 0.65) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklySvg {
  background: rgba(22, 24, 32, 0.5) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyMainBackground { fill: transparent !important; }
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="menu-bar_menu-bar_"] {
  background: rgba(28, 29, 36, 0.6) !important;
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="green-flag_green-flag_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="stop-all_stop-all_"] {
  background: rgba(30, 32, 42, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="extension-button-container"] {
  background: rgba(30, 32, 42, 0.55) !important;
  backdrop-filter: blur(9px) saturate(150%);
  -webkit-backdrop-filter: blur(9px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="menu_menu_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="menu_submenu_"] [class*="menu_menu_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="modal_modal-content_"] {
  background: rgba(38, 39, 48, 0.92) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  color: #e8e9ee;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="menu_submenu_"] { background: transparent !important; }
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="settings-modal_body_"],
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="library_library-scroll-grid_"] {
  background: transparent !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="stage-header_stage-button_"] {
  background: rgba(42, 44, 55, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="stage-header_stage-button_"]:hover {
  background: rgba(54, 57, 70, 0.9) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="stage-header_stage-button-icon_"] {
  filter: grayscale(100%) brightness(1.7) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .pause-btn {
  background-color: rgba(42, 44, 55, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .pause-btn:hover {
  background-color: rgba(54, 57, 70, 0.9) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menu {
  background: #23242b !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menuitem,
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menuitem-content {
  color: #e8e9ee !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menuitem-highlight,
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menuitem-hover {
  background-color: #34363f !important;
  border-color: #34363f !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyWidgetDiv .goog-menuitem-disabled .goog-menuitem-content {
  color: #666a7a !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyDropDownDiv {
  border-color: rgba(255, 255, 255, 0.12) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyDropDownDiv .goog-menuitem {
  color: #e8e9ee !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyDropDownDiv .goog-menuitem-highlight,
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyDropDownDiv .goog-menuitem-hover {
  background-color: #34363f !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyCheckbox {
  fill: #ffffff !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyScrollbarHandle {
  fill: #555a6a !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyScrollbarHandle:hover {
  fill: #6a7080 !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .blocklyZoom > image {
  filter: invert(100%) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .Popover {
  color-scheme: dark !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .Popover-body {
  color: #e8e9ee !important;
  background: rgba(36, 37, 46, 0.92) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0px 0px 8px 1px rgba(0, 0, 0, 0.45) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark .Popover-tipShape {
  fill: rgba(36, 37, 46, 0.92) !important;
  stroke: rgba(255, 255, 255, 0.12) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf .blocklyToolboxDiv,
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="sprite-selector_sprite-selector_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="selector_wrapper_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="gui_tab_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf .blocklyTreeRow,
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf .scratchCategoryMenuItem,
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf .blocklySvg,
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="green-flag_green-flag_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="stop-all_stop-all_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="extension-button-container"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="settings-modal_body_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="library_library-scroll-grid_"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: rgba(30, 32, 42, 0.6) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="menu_menu_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="modal_modal-content_"] {
  backdrop-filter: blur(16px) saturate(155%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(155%) !important;
  background: rgba(38, 39, 48, 0.92) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="gui_gui_"],
html.tw-misty-sand-theme.tw-misty-sand-dark.tw-custom-bg-perf [class*="gui_body-wrapper_"] {
  background: transparent !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_backpack-container_"] {
  background: rgba(30, 32, 42, 0.45) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_backpack-header_"] {
  background: rgba(38, 39, 48, 0.85) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #e8e9ee !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_backpack-header_"]:hover {
  background: rgba(46, 49, 62, 0.9) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_backpack-list_"] {
  border-color: rgba(255, 255, 255, 0.12) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_status-message_"] {
  color: #cccccc !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_error-message_"] {
  color: #ff8a8a !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_more_"] {
  background: rgba(59, 73, 108, 0.95) !important;
  color: #ffffff !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [class*="backpack_drag-over_"]:after {
  background-color: #5b9ef0 !important;
}
`;

let activeGui = null;

let lastThemeAccent = null;
let lastCustomAccent = null;

const BLOCK_COLOR_NAMES = [
    // Corresponds to the name of the object in blockColors
    'motion',
    'looks',
    'sounds',
    'control',
    'event',
    'sensing',
    'pen',
    'operators',
    'data',
    'data_lists',
    'more',
    'addons'
];

/**
 * @param {string} css CSS color or var(--...)
 * @returns {string} evaluated CSS
 */
const evaluateCSS = css => {
    const variableMatch = css.match(/^var\(([\w-]+)\)$/);
    if (variableMatch) {
        return getComputedStyle(document.documentElement).getPropertyValue(variableMatch[1]).trim();
    }
    return css;
};

const CHECKBOX_COLOUR_KEYS = [
    'checkboxInactiveBackground',
    'checkboxInactiveBorder',
    'checkboxActiveBackground',
    'checkboxActiveBorder',
    'checkboxCheck'
];

const syncBlocklyCheckboxColours = theme => {
    const ScratchBlocks = (typeof window !== 'undefined') && (window.ScratchBlocks || window.Blockly);
    if (!ScratchBlocks || !ScratchBlocks.Colours || !ScratchBlocks.Css) {
        return;
    }
    const blockColors = (typeof theme.getBlockColors === 'function') ? theme.getBlockColors() : {};
    let changed = false;
    for (const key of CHECKBOX_COLOUR_KEYS) {
        const value = (typeof blockColors[key] === 'string' && blockColors[key]) || ScratchBlocks.Colours[key];
        if (ScratchBlocks.Colours[key] !== value) {
            ScratchBlocks.Colours[key] = value;
            changed = true;
        }
    }
    if (changed && ScratchBlocks.Css.styleSheet_ && typeof ScratchBlocks.Css.mediaPath_ === 'string') {
        try {
            ScratchBlocks.Css.inject(true, ScratchBlocks.Css.mediaPath_);
        } catch (e) {
        }
    }
};

/**
 * @param {Theme} theme the theme
 */
const applyGuiColors = theme => {
    const doc = document.documentElement;

    syncBlocklyCheckboxColours(theme);

    const defaultGuiColors = Theme.light.getGuiColors();
    for (const [name, value] of Object.entries(defaultGuiColors)) {
        doc.style.setProperty(`--${name}-default`, value);
    }

    const guiColors = theme.getGuiColors();
    for (const [name, value] of Object.entries(guiColors)) {
        doc.style.setProperty(`--${name}`, value);
    }

    const blockColors = theme.getBlockColors();
    doc.style.setProperty('--editorTheme3-blockText', blockColors.text);
    doc.style.setProperty('--editorTheme3-inputColor', blockColors.textField);
    doc.style.setProperty('--editorTheme3-inputColor-text', blockColors.textFieldText);
    for (const color of BLOCK_COLOR_NAMES) {
        doc.style.setProperty(`--editorTheme3-${color}-primary`, blockColors[color].primary);
        doc.style.setProperty(`--editorTheme3-${color}-secondary`, blockColors[color].secondary);
        doc.style.setProperty(`--editorTheme3-${color}-tertiary`, blockColors[color].tertiary);
        doc.style.setProperty(`--editorTheme3-${color}-field-background`, blockColors[color].quaternary);
    }

    // Some browsers will color their interfaces to match theme-color, so if we make it the same color as our
    // menu bar, it'll look pretty cool.
    let metaThemeColor = document.head.querySelector('meta[name=theme-color]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', evaluateCSS(guiColors['menu-bar-background']));

    // a horrible hack for icons...
    lastThemeAccent = guiColors['looks-secondary'];
    window.Recolor = {
        primary: lastThemeAccent
    };
    AddonHooks.recolorCallbacks.forEach(i => i());

    if (typeof window !== 'undefined' && window.EditorPreload && window.EditorPreload.setNativeTheme) {
        try {
            window.EditorPreload.setNativeTheme(theme.isDark());
        } catch (e) {
            // ignore: native theme call must not block Blockly chrome theming
        }
    }

    if (typeof document !== 'undefined') {
        const doc = document.documentElement;
        doc.classList.toggle('tw-dark-theme', theme.isDark());
        doc.classList.toggle('tw-misty-sand-theme', theme.gui === GUI_MISTY_SAND);
        applyBlocklyChromeStyles(theme);
        applyDarkUiStyles(theme);
    }

    applyCustomTheme(theme);
};

const updateFullscreenBgVisibility = () => {
    const layer = document.getElementById('tw-editor-bg-layer');
    if (!layer) return;
    const fullscreen = document.querySelector('[class*="stage-wrapper_stage-wrapper_"][class*="stage-wrapper_full-screen_"]');
    layer.style.zIndex = fullscreen ? '499' : '-1';
};

const ensureFullscreenBgObserver = () => {
    if (typeof MutationObserver === 'undefined' || typeof window === 'undefined') {
        updateFullscreenBgVisibility();
        return;
    }
    if (window.__twFullscreenBgObserver) {
        updateFullscreenBgVisibility();
        return;
    }
    const wrapper = document.querySelector('[class*="stage-wrapper_stage-wrapper_"]');
    if (!wrapper) {
        updateFullscreenBgVisibility();
        return;
    }
    const observer = new MutationObserver(() => {
        updateFullscreenBgVisibility();
    });
    observer.observe(wrapper, {
        attributes: true,
        attributeFilter: ['class']
    });
    window.__twFullscreenBgObserver = observer;
    updateFullscreenBgVisibility();
};

const applyCustomTheme = (theme, forceDarkMode) => {
    if (typeof document === 'undefined') {
        return;
    }

    if (theme) {
        activeGui = theme.gui;
    }

    const custom = getCurrent();
    const darkMode = typeof forceDarkMode === 'boolean' ? forceDarkMode : !!custom.darkMode;

    {
        const accentCustom = custom.accentCustom || '';
        const accentChanged = accentCustom !== lastCustomAccent;
        document.documentElement.classList.toggle('tw-custom-accent', !!accentCustom);
        if (accentChanged) {
            lastCustomAccent = accentCustom;
            let accentStyle = document.getElementById('tw-custom-accent');
            if (!accentStyle) {
                accentStyle = document.createElement('style');
                accentStyle.id = 'tw-custom-accent';
                document.head.appendChild(accentStyle);
            }
            if (accentCustom) {
                accentStyle.textContent =
                    'html.tw-custom-accent {' +
                    ` --looks-secondary: ${accentCustom} !important;` +
                    ` --looks-transparent: ${accentCustom}59 !important;` +
                    ` --looks-light-transparent: ${accentCustom}26 !important;` +
                    ` --looks-secondary-dark: ${accentCustom} !important;` +
                    ' }';
            } else {
                accentStyle.textContent = '';
                if (lastThemeAccent) {
                    window.Recolor = {primary: lastThemeAccent};
                    if (AddonHooks.recolorCallbacks) {
                        AddonHooks.recolorCallbacks.forEach(i => i());
                    }
                }
            }
        }
        if (accentCustom && (accentChanged || theme)) {
            window.Recolor = {primary: accentCustom};
            if (AddonHooks.recolorCallbacks) {
                AddonHooks.recolorCallbacks.forEach(i => i());
            }
        }
    }

    if (activeGui !== GUI_MISTY_SAND) {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('tw-custom-html-bg');
            document.documentElement.classList.remove('tw-custom-bg-perf');
            document.documentElement.classList.remove('tw-misty-sand-dark');
        }
        const cssStyle = document.getElementById('tw-custom-css');
        if (cssStyle) {
            cssStyle.textContent = '';
        }
        const baseStyle = document.getElementById('tw-misty-sand-base');
        if (baseStyle) {
            baseStyle.textContent = '';
        }
        const darkStyle = document.getElementById('tw-misty-sand-dark');
        if (darkStyle) {
            darkStyle.textContent = '';
        }
        const bgLayer = document.getElementById('tw-editor-bg-layer');
        if (bgLayer) {
            if (bgLayer._bgUrl) {
                URL.revokeObjectURL(bgLayer._bgUrl);
                bgLayer._bgUrl = null;
            }
            bgLayer.remove();
        }
        const fsLayer = document.getElementById('tw-fullscreen-bg');
        if (fsLayer) {
            if (fsLayer._bgUrl) {
                URL.revokeObjectURL(fsLayer._bgUrl);
                fsLayer._bgUrl = null;
            }
            fsLayer.remove();
        }
        const tbLayer = document.getElementById('tw-toolbar-bg-layer');
        if (tbLayer) {
            if (tbLayer._bgUrl) {
                URL.revokeObjectURL(tbLayer._bgUrl);
                tbLayer._bgUrl = null;
            }
            tbLayer.remove();
        }
        const bgStyle = document.getElementById('tw-custom-bg');
        if (bgStyle) {
            bgStyle.textContent = '';
        }
        const tbStyle = document.getElementById('tw-toolbar-bg');
        if (tbStyle) {
            tbStyle.textContent = '';
        }
        if (window.__twFullscreenBgObserver) {
            window.__twFullscreenBgObserver.disconnect();
            window.__twFullscreenBgObserver = null;
        }
        return;
    }

    let baseStyle = document.getElementById('tw-misty-sand-base');
    if (!baseStyle) {
        baseStyle = document.createElement('style');
        baseStyle.id = 'tw-misty-sand-base';
        document.head.appendChild(baseStyle);
    }
    if (baseStyle.textContent !== MISTY_SAND_DEFAULT_CSS) {
        baseStyle.textContent = MISTY_SAND_DEFAULT_CSS;
    }

    document.documentElement.classList.toggle('tw-misty-sand-dark', darkMode);
    let darkStyle = document.getElementById('tw-misty-sand-dark');
    if (darkMode) {
        if (!darkStyle) {
            darkStyle = document.createElement('style');
            darkStyle.id = 'tw-misty-sand-dark';
            document.head.appendChild(darkStyle);
        }
        if (darkStyle.textContent !== MISTY_SAND_DARK_CSS) {
            darkStyle.textContent = MISTY_SAND_DARK_CSS;
        }
    } else if (darkStyle) {
        if (darkStyle.textContent !== '') {
            darkStyle.textContent = '';
        }
    }

    if (typeof window !== 'undefined' && window.EditorPreload && window.EditorPreload.setNativeTheme) {
        try {
            window.EditorPreload.setNativeTheme(darkMode);
        } catch (e) {
            // ignore: native theme call must not block Blockly chrome theming
        }
    }

    let cssStyle = document.getElementById('tw-custom-css');
    if (!cssStyle) {
        cssStyle = document.createElement('style');
        cssStyle.id = 'tw-custom-css';
        document.head.appendChild(cssStyle);
    }
    cssStyle.textContent = custom.globalCss || '';

    const bg = custom.editorBackground;
    const hasBg = bg && typeof bg.value === 'string' && bg.value !== '';
    const isHtml = hasBg && bg.type === 'html';

    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('tw-custom-html-bg', isHtml);
        document.documentElement.classList.toggle('tw-custom-bg-perf', isHtml && !!custom.performanceMode);
    }

    let bgLayer = document.getElementById('tw-editor-bg-layer');
    if (isHtml) {
        if (!bgLayer) {
            bgLayer = document.createElement('iframe');
            bgLayer.id = 'tw-editor-bg-layer';
            bgLayer.setAttribute('title', '');
            bgLayer.setAttribute('tabindex', '-1');
            bgLayer.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-presentation');
            document.body.appendChild(bgLayer);
        }
        if (bgLayer.getAttribute('data-bg-content') !== bg.value) {
            bgLayer.setAttribute('data-bg-content', bg.value);
            const blob = new Blob([bg.value], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            if (bgLayer._bgUrl) {
                URL.revokeObjectURL(bgLayer._bgUrl);
            }
            bgLayer._bgUrl = url;
            bgLayer.setAttribute('src', url);
        }
    } else if (bgLayer) {
        if (bgLayer._bgUrl) {
            URL.revokeObjectURL(bgLayer._bgUrl);
            bgLayer._bgUrl = null;
        }
        bgLayer.remove();
        bgLayer = null;
    }

    let bgStyle = document.getElementById('tw-custom-bg');
    if (!bgStyle) {
        bgStyle = document.createElement('style');
        bgStyle.id = 'tw-custom-bg';
        document.head.appendChild(bgStyle);
    }

    const rules = [];
    if (isHtml) {
        let bgLayerRule = '#tw-editor-bg-layer { position: fixed; inset: 0; z-index: -1; border: 0; width: 100%; height: 100%; display: block; overflow: hidden; pointer-events: none;';
        if (custom.performanceMode) {
            bgLayerRule += ' transform: translateZ(0); will-change: transform; contain: strict; content-visibility: auto;';
        }
        bgLayerRule += ' }';
        rules.push(bgLayerRule);
        rules.push('[class*="gui_gui_"], [class*="gui_body-wrapper_"], [class*="gui_tab-panel_"], ' +
            '[class*="blocks_blocks_"], .blocklyToolboxDiv, [class*="sprite-selector_sprite-selector_"], ' +
            '[class*="sprite-selector_scroll-wrapper"], [class*="stage_stage_"], [class*="modal_modal-content_"], ' +
            '[class*="library_library-scroll-grid_"] ' +
            '{ background-color: transparent !important; background-image: none !important; }');
        rules.push('.blocklySvg { background-color: transparent !important; }');
        rules.push('.blocklyMainBackground { fill: transparent !important; }');
        rules.push('.blocklyFlyoutBackground { fill: transparent !important; }');
    }

    rules.push('[class*="stage-wrapper_stage-wrapper_"][class*="stage-wrapper_full-screen_"] { background: transparent !important; }');

    const nextBgRules = rules.join('\n');
    if (bgStyle.textContent !== nextBgRules) {
        bgStyle.textContent = nextBgRules;
    }

    if (hasBg && isHtml) {
        ensureFullscreenBgObserver();
    }

    const tb = custom.toolbarBackground;
    const hasTb = tb && typeof tb.value === 'string' && tb.value !== '';
    const isTbHtml = hasTb && tb.type === 'html';

    let tbLayer = document.getElementById('tw-toolbar-bg-layer');
    if (isTbHtml) {
        if (!tbLayer) {
            tbLayer = document.createElement('iframe');
            tbLayer.id = 'tw-toolbar-bg-layer';
            tbLayer.setAttribute('title', '');
            tbLayer.setAttribute('tabindex', '-1');
            tbLayer.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-presentation');
            document.body.appendChild(tbLayer);
        }
        if (tbLayer.getAttribute('data-bg-content') !== tb.value) {
            tbLayer.setAttribute('data-bg-content', tb.value);
            const resetCss = '<style>html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important;overflow:hidden!important}*{box-sizing:border-box}</style>';
            const blob = new Blob([resetCss + tb.value], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            if (tbLayer._bgUrl) {
                URL.revokeObjectURL(tbLayer._bgUrl);
            }
            tbLayer._bgUrl = url;
            tbLayer.setAttribute('src', url);
        }
    } else if (tbLayer) {
        if (tbLayer._bgUrl) {
            URL.revokeObjectURL(tbLayer._bgUrl);
            tbLayer._bgUrl = null;
        }
        tbLayer.remove();
        tbLayer = null;
    }

    let tbStyle = document.getElementById('tw-toolbar-bg');
    if (!tbStyle) {
        tbStyle = document.createElement('style');
        tbStyle.id = 'tw-toolbar-bg';
        document.head.appendChild(tbStyle);
    }

    const menuBarSel = '[class*="menu-bar_menu-bar_"]';
    const tbRules = [
        '#tw-toolbar-bg-layer { position: fixed; top: 0; left: 0; right: 0; width: 100vw; height: var(--tw-menubar-h, 48px); z-index: -1; border: 0; display: block; overflow: hidden; pointer-events: none; }'
    ];

    if (custom.toolbarTransparent) {
        tbRules.push('#tw-toolbar-bg-layer { display: none !important; }');
        tbRules.push(`html.tw-toolbar-transparent ${menuBarSel} { background-color: transparent !important; background-image: none !important; }`);
    } else if (isTbHtml) {
        tbRules.push(`html.tw-toolbar-bg-on ${menuBarSel} { background-color: transparent !important; background-image: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`);
    } else {
        tbRules.push(`[class*="gui_gui_"] ${menuBarSel} { background: var(--menu-bar-background, var(--ui-modal-background, #2b2d35)) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }`);
    }

    if (custom.performanceMode) {
        tbRules.push('#tw-toolbar-bg-layer { transform: translateZ(0); will-change: transform; contain: strict; content-visibility: auto; }');
    }

    const nextTbRules = tbRules.join('\n');
    if (tbStyle.textContent !== nextTbRules) {
        tbStyle.textContent = nextTbRules;
    }

    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('tw-toolbar-transparent', !!custom.toolbarTransparent);
        document.documentElement.classList.toggle('tw-toolbar-bg-on', isTbHtml && !custom.toolbarTransparent);

        const menubar = document.querySelector(menuBarSel);
        const syncMenubarHeight = () => {
            if (!menubar) return;
            const h = `${menubar.offsetHeight}px`;
            document.documentElement.style.setProperty('--tw-menubar-h', h);
            if (tbLayer) {
                tbLayer.style.height = h;
            }
        };
        syncMenubarHeight();
        if (menubar && 'ResizeObserver' in window) {
            if (!window.__twMenubarHeightObserver) {
                window.__twMenubarHeightObserver = new ResizeObserver(syncMenubarHeight);
            }
            window.__twMenubarHeightObserver.disconnect();
            window.__twMenubarHeightObserver.observe(menubar);
        }
    }
};

function ensureTouchTargetStyle () {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.getElementById('tw-touch-target-static')) {
        return;
    }
    const style = document.createElement('style');
    style.id = 'tw-touch-target-static';
    style.textContent = '.blocklyTouchTargetBackground { fill: transparent !important; }';
    document.head.appendChild(style);
}

function applyBlocklyChromeStyles (theme) {
    if (typeof document === 'undefined') {
        return;
    }
    ensureTouchTargetStyle();

    let style = document.getElementById('tw-blockly-chrome');
    if (!style) {
        style = document.createElement('style');
        style.id = 'tw-blockly-chrome';
        document.head.appendChild(style);
    }
    if (!theme || !theme.isDark()) {
        if (style.textContent !== '') {
            style.textContent = '';
        }
        return;
    }
    const colors = typeof theme.getBlockColors === 'function' ? theme.getBlockColors() : {};
    const pick = key => (typeof colors[key] === 'string' && colors[key]) || '';
    const pickOr = (key, fallback) => (typeof colors[key] === 'string' && colors[key]) || fallback;
    const rules = [];
    if (pick('workspace')) {
        rules.push('.blocklySvg { background-color: ' + pick('workspace') + ' !important; }');
        rules.push('.blocklyMainBackground { fill: ' + pick('workspace') + ' !important; }');
    }
    rules.push('.blocklyTouchTargetBackground { fill: transparent !important; }');

    rules.push('.blocklyFlyoutCheckbox { fill: ' + pickOr('checkboxInactiveBackground', '#222222') + ' !important; stroke: ' + pickOr('checkboxInactiveBorder', '#c8c8c8') + ' !important; }');
    rules.push('.checked > .blocklyFlyoutCheckbox { fill: ' + pickOr('checkboxActiveBackground', '#4C97FF') + ' !important; stroke: ' + pickOr('checkboxActiveBorder', '#3373CC') + ' !important; }');
    rules.push('.blocklyFlyoutCheckboxPath { stroke: transparent !important; }');
    rules.push('.checked > .blocklyFlyoutCheckboxPath { stroke: ' + pickOr('checkboxCheck', '#ffffff') + ' !important; }');
    if (pick('flyout')) {
        rules.push('.blocklyFlyoutBackground { fill: ' + pick('flyout') + ' !important; }');
    }
    if (pick('toolbox')) {
        rules.push('.blocklyToolboxDiv { background-color: ' + pick('toolbox') + ' !important; }');
    }
    if (pick('toolboxText')) {
        rules.push('.blocklyToolboxDiv { color: ' + pick('toolboxText') + ' !important; }');
    }
    if (pick('toolboxHover')) {
        rules.push('.blocklyTreeRow:not(.blocklyTreeSelected):hover { background-color: ' + pick('toolboxHover') + ' !important; }');
    }
    if (pick('scrollbar')) {
        rules.push('.blocklyScrollbarHandle { fill: ' + pick('scrollbar') + ' !important; }');
        rules.push('.blocklyFlyout .blocklyScrollbarHandle { fill: ' + pick('scrollbar') + ' !important; }');
    }
    if (pick('scrollbarHover')) {
        rules.push('.blocklyScrollbarBackground:hover + .blocklyScrollbarHandle, .blocklyScrollbarHandle:hover { fill: ' + pick('scrollbarHover') + ' !important; }');
        rules.push('.blocklyFlyout .blocklyScrollbarBackground:hover + .blocklyScrollbarHandle, .blocklyFlyout .blocklyScrollbarHandle:hover { fill: ' + pick('scrollbarHover') + ' !important; }');
    }
    if (pick('zoomIconFilter') && pick('zoomIconFilter') !== 'none') {
        rules.push('.blocklyZoom > image { filter: ' + pick('zoomIconFilter') + ' !important; }');
    }
    if (pick('buttonBorder')) {
        rules.push('.blocklyFlyoutButtonBackground { stroke: ' + pick('buttonBorder') + ' !important; }');
    }
    if (pick('buttonActiveBackground')) {
        rules.push('.blocklyFlyoutButton:hover { fill: ' + pick('buttonActiveBackground') + ' !important; }');
    }
    if (pick('buttonForeground')) {
        rules.push('.blocklyFlyoutButton .blocklyText { fill: ' + pick('buttonForeground') + ' !important; }');
    }
    if (pick('flyoutLabelColor')) {
        rules.push('.blocklyFlyoutLabelText { fill: ' + pick('flyoutLabelColor') + ' !important; }');
    }
    if (pick('contextMenuBackground')) {
        const border = pick('contextMenuBorder') || pick('contextMenuBackground');
        rules.push('.blocklyWidgetDiv .goog-menu { background: ' + pick('contextMenuBackground') + ' !important; border-color: ' + border + ' !important; }');
    }
    if (pick('contextMenuForeground')) {
        rules.push('.blocklyWidgetDiv .goog-menu { color: ' + pick('contextMenuForeground') + ' !important; }');
        rules.push('.blocklyWidgetDiv .goog-menuitem-content { color: ' + pick('contextMenuForeground') + ' !important; }');
    }
    if (pick('contextMenuActiveBackground')) {
        rules.push('.blocklyWidgetDiv .goog-menuitem-highlight, .blocklyWidgetDiv .goog-menuitem-hover { background-color: ' + pick('contextMenuActiveBackground') + ' !important; border-color: ' + pick('contextMenuActiveBackground') + ' !important; }');
    }
    if (pick('contextMenuDisabledForeground')) {
        rules.push('.blocklyWidgetDiv .goog-menuitem-disabled .goog-menuitem-content { color: ' + pick('contextMenuDisabledForeground') + ' !important; }');
    }
    if (pick('text')) {
        rules.push('.blocklyDropDownDiv .goog-menuitem { color: ' + pick('text') + ' !important; }');
    }
    if (pick('checkboxCheck')) {
        rules.push('.blocklyCheckbox { fill: ' + pick('checkboxCheck') + ' !important; }');
    }
    const next = rules.join('\n');
    if (style.textContent !== next) {
        style.textContent = next;
    }
}

const DARK_UI_CSS = [
    'html.tw-dark-theme [class*="stage-header_stage-button_"] {',
    '  background: #1e1e1e !important;',
    '  border: 1px solid rgba(255,255,255,0.15) !important;',
    '  box-shadow: 0 1px 3px rgba(0,0,0,0.5) !important;',
    '}',
    'html.tw-dark-theme [class*="stage-header_stage-button_"]:hover {',
    '  background: #2e2e2e !important;',
    '}',
    'html.tw-dark-theme [class*="stage-header_stage-button-icon_"] {',
    '  filter: grayscale(100%) brightness(1.7) !important;',
    '}',
    'html.tw-dark-theme [class*="stage-header_fullscreen-buttons-row_"],',
    'html.tw-dark-theme [class*="stage-header_stage-size-row_"] {',
    '  background: rgba(255,255,255,0.08) !important;',
    '}',
    'html.tw-dark-theme .pause-btn {',
    '  background-color: #1e1e1e !important;',
    '  border: 1px solid rgba(255,255,255,0.15) !important;',
    '}',
    'html.tw-dark-theme .pause-btn:hover {',
    '  background-color: #2e2e2e !important;',
    '}'
].join('\n');

function applyDarkUiStyles (theme) {
    if (typeof document === 'undefined') {
        return;
    }
    const darkUiActive = !!(theme && theme.isDark());
    let style = document.getElementById('tw-dark-ui');
    if (!style) {
        style = document.createElement('style');
        style.id = 'tw-dark-ui';
        document.head.appendChild(style);
    }
    const next = darkUiActive ? DARK_UI_CSS : '';
    if (style.textContent !== next) {
        style.textContent = next;
    }
}

export {
    applyGuiColors,
    applyCustomTheme,
    MISTY_SAND_DEFAULT_CSS
};
