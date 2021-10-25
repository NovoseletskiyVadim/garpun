class EventHandlerError {
    constructor(error, props) {
        this.errorText = error.errorText || '';
        this.statusCode = error.statusCode !== 0 ? error.statusCode : '';
        this.apiURL = error.apiURL || '?';
        this.senderName = props.senderName;
        this.cameraName = props.fileMeta ? props.fileMeta.cameraName : '?';
        this.file = props.fileMeta
            ? props.fileMeta?.file
            : { name: '', ext: '' };
    }

    getFileName() {
        const { name, ext } = this.file;
        if (name && ext) {
            return `fileName:${name + ext}`;
        }
        return false;
    }

    toPrint() {
        return `[${
            this.senderName
        }_API_ERROR] ${`${this.statusCode} ${this.errorText}`} ${
            this.apiURL && `UPL:${this.apiURL}`
        } camera:${this.cameraName} ${this.getFileName()}`;
    }
}

module.exports = EventHandlerError;
