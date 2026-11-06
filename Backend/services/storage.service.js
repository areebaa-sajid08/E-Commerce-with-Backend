import ImageKit from "@imagekit/nodejs"
import env from "../src/config/env.js"

const client = new ImageKit({ privateKey: env.imagekitKey })

// returns { url, fileId }
export async function uploadFile(buffer, folder = "products") {
    const response = await client.files.upload({
        file: buffer.toString("base64"),
        fileName: `img_${Date.now()}_${Math.round(Math.random() * 1e6)}.jpg`,
        folder,
    })
    return { url: response.url, fileId: response.fileId }
}

export async function deleteFile(fileId) {
    if (!fileId) return
    try {
        await client.files.delete(fileId)
    } catch (err) {
        console.error("ImageKit delete failed:", err?.message || err)
    }
}

export default uploadFile
