import _cloneDeep from 'lodash/cloneDeep';

class ApActionRender {
    constructor() {
        this.eGui = document.createElement('div');
    }
    init(node) {
        this.eGui.innerHTML = `<div class="btn-group.btn-group-xs">
            <a class="btn btn-primary" id="editBtn">Edit</a>
            ${node.currentUser.profileName === 'admin' ? '<a class="btn btn-success" id="moveBtn" style="display:none"></a>' : '<a class="btn btn-success" id="moveBtn">Move</a>'}
            <a class="btn btn-danger" id="removeBtn">Delete</a>
            <a class="btn btn-default" style="display:none" id="cancelBtn">Cancel</a>
        </div>`;

        // get references to the elements we want
        this.eButton = this.eGui.querySelector('#editBtn');
        this.movButton = this.eGui.querySelector('#moveBtn');
        this.delButton = this.eGui.querySelector('#removeBtn');
        this.canButton = this.eGui.querySelector('#cancelBtn');

        // add event listener to button
        const that = this;
        this.editEventListener = () => {
            if (node.data.selected) {
                node.data.selected = false;
                node.node.stopFromCmd = true;

                that.eButton.innerHTML = 'Edit';
                that.eButton.className = 'btn btn-primary';
                that.delButton.style.display = null;
                that.movButton.style.display = null;
                that.canButton.style.display = 'none';

                node.api.stopEditing();
            } else {
                node.api.setFocusedCell(node.rowIndex, 'make');
                node.api.startEditingCell({ rowIndex: node.rowIndex, colKey: 'name' });
                node.node.oldData = _cloneDeep(node.data);

                node.data.selected = true;
                node.node.stopFromCmd = false;

                that.eButton.innerHTML = 'Save';
                that.eButton.className = 'btn btn-success';
                that.canButton.style.display = null;
                that.delButton.style.display = 'none';
                that.movButton.style.display = 'none';
            }
        };
        this.removeEventListener = () => {
            node.remove(node.data);
        };
        this.cancelEventListener = () => {
            node.api.stopEditing(true);
        };
        this.movEventListener = () => {
            node.move(node.data);
        };
        this.eButton.addEventListener('click', this.editEventListener);
        this.movButton.addEventListener('click', this.movEventListener);
        this.delButton.addEventListener('click', this.removeEventListener);
        this.canButton.addEventListener('click', this.cancelEventListener);
    }
    getGui() {
        return this.eGui;
    }
    refresh(node) {
        if (node.data.selected) {
            this.eButton.innerHTML = 'Save';
            this.delButton.style.display = 'none';
        } else {
            this.eButton.innerHTML = 'Edit';
            this.delButton.style.display = null;
        }
        // this.eValue.innerHTML = params.valueFormatted ? params.valueFormatted : params.value;
        // return true to tell the grid we refreshed successfully
    }
    destroy() {
        this.eButton.removeEventListener('click', this.editEventListener);
        this.delButton.removeEventListener('click', this.removeEventListener);
        this.canButton.removeEventListener('click', this.cancelEventListener);
    }
}

export default ApActionRender;
