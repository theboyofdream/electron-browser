import { useState } from "react"

export const useLocalDownloads = () => {
const [downloading, setDownloading] = useState(false)
    return {
     downloading,setDownloading
    }
}
