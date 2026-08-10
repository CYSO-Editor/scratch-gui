
// (backdrop-filter blur) effect lives in MISTY_SAND_DEFAULT_CSS (guiHelpers),
// scoped to the .tw-misty-sand-theme root class.
const guiColors = {
    'color-scheme': 'light',

    'ui-primary': 'hsla(40, 30%, 96%, 1)', /* soft sand */
    'ui-secondary': 'hsla(40, 25%, 93%, 1)',
    'ui-tertiary': 'hsla(40, 20%, 88%, 1)',

    'ui-modal-overlay': 'hsla(220, 30%, 55%, 0.22)',
    'ui-modal-background': 'hsla(0, 0%, 100%, 0.72)',
    'ui-modal-foreground': 'hsla(220, 22%, 28%, 1)',
    'ui-modal-header-background': 'var(--looks-secondary)',
    'ui-modal-header-foreground': '#ffffff',

    'ui-white': 'hsla(0, 0%, 100%, 0.7)',
    'ui-white-dim': 'hsla(0, 0%, 100%, 0.6)',
    'ui-white-transparent': 'hsla(0, 0%, 100%, 0.2)',
    'ui-transparent': 'hsla(0, 0%, 100%, 0)',

    'ui-black-transparent': 'hsla(220, 30%, 30%, 0.12)',

    'text-primary': 'hsla(220, 22%, 28%, 1)',
    'text-primary-transparent': 'hsla(220, 22%, 28%, 0.72)',

    'motion-primary': 'hsla(205, 80%, 55%, 1)',
    'motion-primary-transparent': 'hsla(205, 80%, 55%, 0.9)',
    'motion-tertiary': 'hsla(205, 70%, 42%, 1)',

    'looks-secondary': 'hsla(255, 45%, 62%, 1)',
    'looks-transparent': 'hsla(255, 45%, 62%, 0.35)',
    'looks-light-transparent': 'hsla(255, 45%, 62%, 0.15)',
    'looks-secondary-dark': 'hsla(255, 35%, 52%, 1)',

    'red-primary': 'hsla(15, 85%, 58%, 1)',
    'red-tertiary': 'hsla(15, 85%, 48%, 1)',

    'sound-primary': 'hsla(295, 50%, 62%, 1)',
    'sound-tertiary': 'hsla(295, 45%, 52%, 1)',

    'control-primary': 'hsla(38, 95%, 55%, 1)',

    'data-primary': 'hsla(28, 95%, 56%, 1)',

    'pen-primary': 'hsla(160, 70%, 42%, 1)',
    'pen-transparent': 'hsla(160, 70%, 42%, 0.25)',
    'pen-tertiary': 'hsla(160, 72%, 32%, 1)',

    'error-primary': 'hsla(28, 95%, 56%, 1)',
    'error-light': 'hsla(28, 95%, 70%, 1)',
    'error-transparent': 'hsla(28, 95%, 56%, 0.25)',

    'extensions-primary': 'hsla(160, 70%, 42%, 1)',
    'extensions-tertiary': 'hsla(160, 72%, 32%, 1)',
    'extensions-transparent': 'hsla(160, 70%, 42%, 0.35)',
    'extensions-light': 'hsla(160, 50%, 85%, 1)',

    'drop-highlight': 'hsla(205, 90%, 72%, 1)',

    // Translucent so the frosted-glass background (set in misty-sand.css) shows through.
    'menu-bar-background': 'hsla(0, 0%, 100%, 0.5)',
    'menu-bar-background-image': 'none',
    'menu-bar-foreground': 'hsla(220, 25%, 25%, 1)',

    'assets-background': 'hsla(0, 0%, 100%, 0.55)',

    'input-background': 'hsla(0, 0%, 100%, 0.7)',

    'popover-background': 'hsla(0, 0%, 100%, 0.85)',

    'shadow': 'hsla(220, 30%, 40%, 0.18)',

    'badge-background': 'hsla(205, 60%, 90%, 1)',
    'badge-border': 'hsla(205, 60%, 80%, 1)',

    'fullscreen-background': 'hsla(0, 0%, 100%, 0.8)',
    'fullscreen-accent': 'hsla(205, 40%, 92%, 1)',

    'page-background': 'hsla(40, 30%, 96%, 1)',
    'page-foreground': 'hsla(220, 22%, 28%, 1)',

    'project-title-inactive': 'hsla(0, 0%, 100%, 0.4)',
    'project-title-hover': 'hsla(0, 0%, 100%, 0.7)',

    'link-color': 'hsla(220, 70%, 45%, 1)',

    'filter-icon-black': 'none',
    'filter-icon-gray': 'grayscale(100%)',
    'filter-icon-white': 'none',

    'paint-ui-pane-border': 'hsla(220, 30%, 40%, 0.12)',
    'paint-text-primary': 'hsla(220, 22%, 28%, 1)',
    'paint-form-border': 'hsla(220, 30%, 40%, 0.12)',
    'paint-looks-secondary': 'var(--looks-secondary)',
    'paint-looks-transparent': 'var(--looks-transparent)',
    'paint-input-background': 'var(--input-background)',
    'paint-popover-background': 'var(--popover-background)',
    'paint-filter-icon-gray': 'none'
};

const blockColors = {};

export {
    guiColors,
    blockColors
};
