"use strict"

import fs, { createWriteStream, renameSync, writeFileSync, unlinkSync } from "node:fs"
import { basename, extname, join, dirname } from "node:path"
import { app, dialog } from "electron"
import { tmpdir } from "node:os"
import axios from "axios"
import FormData from "form-data"

const SERVER_URL = "http://localhost:8000"
const pathToDownloadsFolder = app.getPath("downloads")

const Downloader = {
    /**
     * Fetch metadata (name, size, ext)
     * @param {string} url
     * @returns {Promise<{name: string, size: number, ext: string, saveToPath: string}>}
     */
    async _fetchMetadataFromUrl(url) {
        // handle base64
        if (url.startsWith("data:")) {
            const match = url.match(/^data:(.+);base64,/)
            const mime = match?.[1] || "application/octet-stream"
            const ext = mime.split("/")[1] || "bin"
            const name = "file" // no ext here
            const base64Data = url.split(",")[1] || ""
            const size = Buffer.byteLength(base64Data, "base64")
            const saveToPath = join(pathToDownloadsFolder, `${name}.${ext}`)
            return { name, size, ext, saveToPath }
        }

        let fullName = basename(new URL(url).pathname)
        let ext = extname(fullName).slice(1) || "bin"
        let name = fullName.replace(/\.[^/.]+$/, "") // remove ext
        let size = 0

        try {
            const head = await axios.head(url)
            size = parseInt(head.headers["content-length"] || "0")

            const disposition = head.headers["content-disposition"]
            if (disposition?.includes("filename=")) {
                const match = disposition.match(/filename="?([^"]+)"?/)
                if (match?.[1]) {
                    fullName = match[1]
                    ext = extname(fullName).slice(1) || "bin"
                    name = fullName.replace(/\.[^/.]+$/, "")
                }
            }
        } catch (e) {
            console.warn("meta fetch failed:", e.message)
        }

        const saveToPath = join(pathToDownloadsFolder, `${name}.${ext}`)
        return { name, size, ext, saveToPath }
    },

    /**
     * Download + verify file
     * @param {string} url
     * @param {{name: string, size: number, ext: string, saveToPath: string}} metadata
     */
    async _download(url, metadata) {
        const skipVerification = url.toLowerCase().startsWith(SERVER_URL)
        const filePlaceholder = metadata.saveToPath + ".ebdownload"

        // Ensure directory exists
        const dir = dirname(metadata.saveToPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // writeFileSync(filePlaceholder, "")

        try {
            // // handles files if size is less then 1MB
            // if (metadata.size < 1_000_000) {
            //     const temp = join(tmpdir(), `${metadata.name}.${metadata.ext}`)
            //     const writer = createWriteStream(temp)
            //     const response = await axios.get(url, { responseType: "stream" })

            //     await new Promise((resolve, reject) => {
            //         response.data.pipe(writer)
            //         writer.on("finish", resolve)
            //         writer.on("error", reject)
            //     })

            //     // console.log({ url, skipVerification })
            //     // if (!skipVerification) {
            //         // console.log({ url, skipVerification })
            //         const form = new FormData()
            //         const fileBuffer = fs.readFileSync(temp)
            //         form.append("url", url)
            //         form.append("file", fileBuffer, `${metadata.name}.${metadata.ext}`)

            //         const res = await axios.post("http://localhost:8000/verify-download", form, {
            //             headers: form.getHeaders()
            //         })

            //         if (res.status !== 200 || !res.data?.healthy) {
            //             unlinkSync(temp)
            //             unlinkSync(filePlaceholder)
            //             return { healthy: false, message: res.data?.message || "File check failed" }
            //         }
            //     // }

            //     // Use the saveToPath from metadata for final destination
            //     renameSync(temp, metadata.saveToPath)
            //     unlinkSync(filePlaceholder) // Remove placeholder after successful rename
            //     return { healthy: true, path: metadata.saveToPath }
            // }

            // console.log({ url, skipVerification })
            let localFileUrl = url
            if (!skipVerification) {
                // console.log({ url, skipVerification })
                // For large files, use the server to download directly to bucket
                const res = await axios.post(`${SERVER_URL}/save-on-server`, { url })
                if (res.status !== 200 || !res.data?.success) {
                    unlinkSync(filePlaceholder)
                    return {
                        healthy: false,
                        success: false,
                        message: res.data?.message || "Server rejected file"
                    }
                }
                localFileUrl = res.data.newUrl
            }

            // Server has downloaded the file and returns the local URL
            // const localFileUrl = !skipVerification ? res.data.newUrl : url

            // Download the file from our local server to the final destination
            const writer = createWriteStream(metadata.saveToPath)
            const response = await axios.get(localFileUrl, { responseType: "stream" })

            await new Promise((resolve, reject) => {
                response.data.pipe(writer)
                writer.on("finish", resolve)
                writer.on("error", reject)
            })

            unlinkSync(filePlaceholder) // Remove placeholder after successful download
            return { healthy: true, success: true, path: metadata.saveToPath, url: localFileUrl }
        } catch (err) {
            if (fs.existsSync(filePlaceholder)) unlinkSync(filePlaceholder)
            console.error("Download failed:", err.message)
            return { healthy: false, success: true, message: err.message }
        }
    },

    async save(url) {
        const metadata = await this._fetchMetadataFromUrl(url)
        return await this._download(url, metadata)
    },

    async saveAs(url) {
        const metadata = await this._fetchMetadataFromUrl(url)
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: "Save As",
            defaultPath: metadata.saveToPath,
            filters: [{ name: "Files", extensions: [metadata.ext] }]
        })
        if (canceled) return

        // Update metadata with chosen file path
        metadata.saveToPath = filePath
        metadata.name = basename(filePath, extname(filePath))
        metadata.ext = extname(filePath).slice(1)
        return await this._download(url, metadata)
    },

    async delete(downloadUrl) {
        const response = await axios.delete(SERVER_URL + downloadUrl)
        return response.data
    }
}

export default Downloader
// "use strict"

// import fs, { createWriteStream, renameSync, writeFileSync, unlinkSync } from "node:fs"
// import { basename, extname, join } from "node:path"
// import { app, dialog } from "electron"
// import { tmpdir } from "node:os"
// import axios from "axios"
// import FormData from "form-data"

// const pathToDownloadsFolder = app.getPath("downloads")

// const Downloader = {
//     /**
//      * Fetch metadata (name, size, ext)
//      * @param {string} url
//      * @returns {Promise<{name: string, size: number, ext: string, saveToPath: string}>}
//      */
//     async _fetchMetadataFromUrl(url) {
//         // handle base64
//         if (url.startsWith("data:")) {
//             const match = url.match(/^data:(.+);base64,/)
//             const mime = match?.[1] || "application/octet-stream"
//             const ext = mime.split("/")[1] || "bin"
//             const name = "file" // no ext here
//             const base64Data = url.split(",")[1] || ""
//             const size = Buffer.byteLength(base64Data, "base64")
//             return { name, size, ext }
//         }

//         let fullName = path.basename(new URL(url).pathname)
//         let ext = path.extname(fullName).slice(1) || "bin"
//         let name = fullName.replace(/\.[^/.]+$/, "") // remove ext
//         let size = 0

//         try {
//             const head = await axios.head(url)
//             size = parseInt(head.headers["content-length"] || "0")

//             const disposition = head.headers["content-disposition"]
//             if (disposition?.includes("filename=")) {
//                 const match = disposition.match(/filename="?([^"]+)"?/)
//                 if (match?.[1]) {
//                     fullName = match[1]
//                     ext = path.extname(fullName).slice(1) || "bin"
//                     name = fullName.replace(/\.[^/.]+$/, "")
//                 }
//             }
//         } catch (e) {
//             console.warn("meta fetch failed:", e.message)
//         }

//         return { name, size, ext, saveToPath: join(pathToDownloadsFolder, `${name}.${ext}`) }
//     },
//     /**
//      * Download + verify file
//      * @param {string} url
//      * @param {{name: string, size: number, ext: string}} metadata
//      */
//     async _download(url, metadata) {
//         const filePlaceholder = join(pathToDownloadsFolder, `${metadata.name}.ebdownload`)
//         writeFileSync(filePlaceholder, "")

//         try {
//             // handles files if size is less then 1MB
//             if (metadata.size < 1_000_000) {
//                 const temp = join(tmpdir(), `${metadata.name}.${metadata.ext}`)
//                 const writer = createWriteStream(temp)
//                 const response = await axios.get(url, { responseType: "stream" })

//                 await new Promise((resolve, reject) => {
//                     response.data.pipe(writer)
//                     writer.on("finish", resolve)
//                     writer.on("error", reject)
//                 })

//                 const form = new FormData()
//                 const fileBuffer = fs.readFileSync(temp)
//                 form.append("url", url)
//                 form.append("file", fileBuffer, metadata.name)

//                 const res = await axios.post("http://localhost:8000/verify-download", form, {
//                     headers: form.getHeaders()
//                 })

//                 if (res.status !== 200 || !res.data?.healthy) {
//                     // unlinkSync(temp)
//                     // unlinkSync(filePlaceholder)
//                     return { healthy: false, message: res.data?.message || "File check failed" }
//                 }

//                 const finalPath = filePlaceholder.replace(".ebdownload", `.${metadata.ext}`)
//                 renameSync(temp, join(pathToDownloadsFolder, `${metadata.name}.${metadata.ext}`))
//                 return { healthy: true, path: finalPath }
//             }

//             const res = await axios.post("http://localhost:8000/prepare-download", { url })
//             if (res.status !== 200 || !res.data?.url) {
//                 unlinkSync(filePlaceholder)
//                 return { healthy: false, message: res.data?.message || "Server rejected file" }
//             }
//             return { healthy: true, url: res.data.url }
//         } catch (err) {
//             if (fs.existsSync(filePlaceholder)) unlinkSync(filePlaceholder)
//             console.error("Download failed:", err.message)
//             return { healthy: false, message: err.message }
//         }
//     },

//     async save(url) {
//         const metadata = await this._fetchMetadataFromUrl(url)
//         return await this._download(url, metadata)
//     },

//     async saveAs(url) {
//         const metadata = await this._fetchMetadataFromUrl(url)
//         const { canceled, filePath } = await dialog.showSaveDialog({
//             title: "Save As",
//             defaultPath: join(pathToDownloadsFolder, metadata.name),
//             filters: [{ name: "Files", extensions: [metadata.ext] }]
//         })
//         if (canceled) return
//         // rewrite name to chosen file name
//         metadata.name = basename(filePath)
//         metadata.ext = extname(filePath)
//         return await this._download(url, metadata)
//     }
// }

// export default Downloader
