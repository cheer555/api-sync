const fs = require('fs-extra');
const path = require('path');

const targetConfigDir = path.join(process.cwd(), './apiSync.config.json');
const tplConfigDir =  path.join(__dirname, '../../tpl/config.json');

// fs.writeFileSync(configJsonDir, `${apiTypeStr}\n`, { encoding: 'utf-8' });
export const init = function () {fs.copy(tplConfigDir, targetConfigDir)
.then(() => console.log(`初始化文件 ${tplConfigDir} success!`))
.catch((err: Error) => console.error(err))}
