import { BrowserWindow } from 'electron'
import path from 'path'

/**
 * Manages lifecycle of the skeleton, that is the main wrapper view handles all other app things.
 */
export class SkeletonManager {

    private _skeletonWindow: BrowserWindow | undefined = undefined

    async init(): Promise<BrowserWindow> {
        // todo lho we should handle multiple windows somehow

        const skeletonWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            webPreferences: {
                preload: path.join(__dirname, 'renderer-preload.js'),
            },
        })

        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await skeletonWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '/src/renderer/skeleton/skeleton.html')
        } else {
            await skeletonWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/skeleton/skeleton.html`))
        }
        // manually uncomment for devtools
        // skeletonWindow.webContents.openDevTools({ mode: 'detach' })

        this._skeletonWindow = skeletonWindow
        return this._skeletonWindow
    }

    get skeletonWindow(): BrowserWindow {
        if (this._skeletonWindow == undefined) {
            throw new Error(`Skeleton is not initialized yet.`)
        }
        return this._skeletonWindow
    }
}
