console.log("IPC starting");
const { ipcRenderer } = require("electron/renderer");

class IPC {
    _args = null;
    get args() {
        if(!this._args) {
            this._args = JSON.parse(ipcRenderer.sendSync("get-args"));
        }
        return this._args;
    }

    log(...data) {
        console.log(...data);
        ipcRenderer.send("log", ...data);
    }
    error(...data) {
        console.error(...data);
        ipcRenderer.send("log", ...data);
    }
}

const ipc = new IPC();
export default ipc;

window.onerror = (e) => {
    ipc.log("error", e);    
};
