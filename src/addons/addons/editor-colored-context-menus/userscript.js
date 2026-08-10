import { removeAlpha, multiply, textColor } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const applyContextMenuColor = (block) => {
    const widgetDiv = ScratchBlocks.WidgetDiv.DIV;
    if (!widgetDiv) {
      return;
    }
    const background = block.svgPath_;
    if (!background) {
      return;
    }
    const fill = removeAlpha(background.getAttribute("fill"));
    if (!fill || fill.charAt(0) !== "#") {
      return;
    }
    const stroke = background.getAttribute("stroke");
    const border = stroke && stroke.charAt(0) === "#" && stroke.length >= 7
      ? removeAlpha(stroke)
      : removeAlpha(multiply(fill, { r: 0.6, g: 0.6, b: 0.6 }));
    const text = textColor(fill);
    widgetDiv.classList.add("sa-contextmenu-colored");
    widgetDiv.style.setProperty("--sa-contextmenu-bg", fill);
    widgetDiv.style.setProperty("--sa-contextmenu-border", border);
    widgetDiv.style.setProperty("--sa-contextmenu-text", text);
  };

  const originalHandleRightClick = ScratchBlocks.Gesture.prototype.handleRightClick;
  ScratchBlocks.Gesture.prototype.handleRightClick = function (...args) {
    const block = this.targetBlock_;
    const ret = originalHandleRightClick.call(this, ...args);
    if (block) {
      applyContextMenuColor(block);
    }
    return ret;
  };

  const originalHide = ScratchBlocks.WidgetDiv.hide;
  ScratchBlocks.WidgetDiv.hide = function (...args) {
    if (ScratchBlocks.WidgetDiv.DIV) {
      ScratchBlocks.WidgetDiv.DIV.classList.remove("sa-contextmenu-colored");
    }
    return originalHide.call(this, ...args);
  };
}
