import { readFile as _readFile } from 'fs'
const fileReadCache = {}

async function readFile (path) {
  return await new Promise((resolve, reject) => {
    if (fileReadCache.content != null) {
      const currentTime = new Date()
      const difference = currentTime.getTime() - fileReadCache.time.getTime()
      const resultInSeconds = Math.round(difference / 1000)
      if (resultInSeconds <= 30) {
        resolve(fileReadCache.content)
        return
      }
    }
    _readFile(
      path,
      'utf8',
      (err, content) => {
        if (err != null) {
          reject(err)
        }
        fileReadCache.time = new Date()
        resolve(content)
      }
    )
  })
}

export default {
  readFile
}
