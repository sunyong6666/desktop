(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["addon-entry-disable-stage-drag-select"],{

/***/ "./node_modules/scratch-gui/src/addons/addons/disable-stage-drag-select/_runtime_entry.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/scratch-gui/src/addons/addons/disable-stage-drag-select/_runtime_entry.js ***!
  \************************************************************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./node_modules/scratch-gui/src/addons/addons/disable-stage-drag-select/userscript.js");
/* generated by pull.js */

const resources = {
  "userscript.js": _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"]
};

/***/ }),

/***/ "./node_modules/scratch-gui/src/addons/addons/disable-stage-drag-select/userscript.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/scratch-gui/src/addons/addons/disable-stage-drag-select/userscript.js ***!
  \********************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (async _ref => {
  let {
    addon,
    console
  } = _ref;
  const vm = addon.tab.traps.vm;
  let shiftKeyPressed = false;
  document.addEventListener("mousedown", function (e) {
    shiftKeyPressed = e.shiftKey;
  }, {
    capture: true
  });

  // Do not focus sprite after dragging it
  const oldStopDrag = vm.stopDrag;
  vm.stopDrag = function () {
    const allowDrag = shiftKeyPressed || addon.settings.get("drag_while_stopped") && !addon.tab.redux.state.scratchGui.vmStatus.running;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    if (allowDrag || addon.self.disabled) return oldStopDrag.call(this, ...args);
    const setEditingTarget = this.setEditingTarget;
    this.setEditingTarget = () => {};
    const r = oldStopDrag.call(this, ...args);
    this.setEditingTarget = setEditingTarget;
    return r;
  };

  // Don't let the editor drag sprites that aren't marked as draggable
  const oldGetTargetIdForDrawableId = vm.getTargetIdForDrawableId;
  vm.getTargetIdForDrawableId = function () {
    const allowDrag = shiftKeyPressed || addon.settings.get("drag_while_stopped") && !addon.tab.redux.state.scratchGui.vmStatus.running;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    const targetId = oldGetTargetIdForDrawableId.call(this, ...args);
    if (allowDrag || addon.self.disabled) return targetId;
    if (targetId !== null) {
      const target = this.runtime.getTargetById(targetId);
      if (target && !target.draggable) {
        return null;
      }
    }
    return targetId;
  };
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-disable-stage-drag-select.index.js.map