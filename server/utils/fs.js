const fs = require('fs');
const fileReadCache = {};

async function readFile (path) {
  return await new Promise((resolve, reject) => {
    if (fileReadCache.content) {
      const currentTime = new Date();
      const difference = currentTime.getTime() - fileReadCache.time.getTime();
      const resultInSeconds = Math.round(difference / 1000);
      if (resultInSeconds <= 30) {
        resolve(fileReadCache.content);
        return;
      }
    }
    fs.readFile(
      path,
      'utf8',
      (err, content) => {
        if (err) {
          reject(err);
        }
        fileReadCache.time = new Date();
        resolve(content);
      },
    );
  });
}

module.exports = {
  readFile,
};
