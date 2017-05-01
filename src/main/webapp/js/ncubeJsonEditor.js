/**
 * JSON Editor
 *     Edit n-cubes in JSON format
 *
 * @author John DeRegnaucourt
 */

var NCubeJsonEditor = (function ($) {
    var nce = null;
    var _editor = null;

    function init(info) {
        var container, options;
        // Create JSON Editor (http://jsoneditoronline.org/downloads/)
        if (!nce) {
            nce = info;
            container = document.getElementById('jsoneditor');
            options = {
                mode: 'code',
                onChange: function () {
                    updateDirtyStatus();
                }
            };

            _editor = new JSONEditor(container, options);
            addSaveButton();

            if (_editor.aceEditor) {
                _editor.aceEditor.session.on('changeScrollTop', function(scrollTop) {
                    saveViewPosition(scrollTop);
                });
            }
        }
        scrollToSavedPosition();
    }

    function scrollToSavedPosition() {
        var pos = nce.getViewPosition() || 0;
        _editor.aceEditor.session.setScrollTop(pos);
    }

    function saveViewPosition(scrollInfo) {
        nce.saveViewPosition(scrollInfo);
    }

    function addSaveButton() {
        var editCtrl = $('#jsoneditor');
        var menu = editCtrl.find('.jsoneditor-menu');
        var save = $("<button/>").attr({
            id: 'saveButton',
            style: 'background-image:none;width:64px',
            title: 'Save changes'
        });
        menu.append(save);           // Add 'Save' button to toolbar
        menu.find('a').remove();

        // Attach listener
        $('#saveButton').click(function () {
            var result;
            var selectedTabAppId = nce.getSelectedTabAppId();
            nce.clearNote();
            if (selectedTabAppId.branch === 'HEAD') {
                nce.selectBranch();
                return;
            }

            clearDirtyStatus();
            updateDirtyStatus();
            result = nce.call(CONTROLLER + CONTROLLER_METHOD.SAVE_JSON, [selectedTabAppId, _editor.getText()]);
            if (result.status) {
                nce.updateCubeLeftHandChangedStatus(nce.getSelectedCubeName(), CHANGETYPE.UPDATED);
            } else {
                nce.showNote('Error saving JSON n-cube:<hr class="hr-small"/>' + result.data);
            }
        });
    }

    function isDirty() {
        if (_editor.aceEditor) {
            return !_editor.aceEditor.getSession().getUndoManager().isClean();
        }
        return false;
    }

    function clearDirtyStatus() {
        var undoMgr;
        if (_editor.aceEditor) {
            undoMgr = _editor.aceEditor.getSession().getUndoManager();
            undoMgr.reset();
            undoMgr.markClean();
        }
    }

    function updateDirtyStatus() {
        var dirty, text;
        var saveButton = $('#saveButton');
        if (!saveButton.length) {
            return;
        }
        dirty = isDirty();
        saveButton.prop('disabled', !dirty);
        text = dirty ? 'Save*' : 'Save';
        saveButton.html(text);
    }

    function load() {
        var result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_JSON, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), {mode:JSON_MODE.JSON}], {noResolveRefs:true});
        if (result.status) {
            try {
                _editor.setText(result.data);
                _editor.format();
            } catch (e) {
                nce.showNote('JSON content too large for the JSON Text Editor.  Capture the JSON from the "Revision History" option.');
                console.log(e);
            }
        } else {
            _editor.setText("Unable to load '" + nce.getSelectedCubeName() + "'. " + result.data);
        }

        clearDirtyStatus();
        updateDirtyStatus();
    }

    function handleCubeSelected() {
        load();
    }

    // Let parent (main frame) know that the child window has loaded.
    // The loading of all of the Javascript (deeply) is continuous on the main thread.
    // Therefore, the setTimeout(, 1) ensures that the main window (parent frame)
    // is called after all Javascript has been loaded.
    if (window.parent.frameLoaded) {
        setTimeout(function () {
            window.parent.frameLoaded(document);
        }, 1);
    }

    return {
        init: init,
        handleCubeSelected: handleCubeSelected,
        load: load
    };

})(jQuery);

function tabActivated(info) {
    NCubeJsonEditor.init(info);
    NCubeJsonEditor.load();
}

function cubeSelected() {
    NCubeJsonEditor.handleCubeSelected();
}

var onNoteEvent = function onNoteEvent(e, element){};