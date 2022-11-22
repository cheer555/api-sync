const program = require("commander");
const packageInfo = require("../package");

program.version(packageInfo.version);

program
  .command("init")
  .description("初始化转换配置")
  .alias("i")
  .action(() => {
    const { init } = require("./cmd/init");
    init();
  });

program
  .command("start")
  .description("开始转换")
  .alias("s")
  .action(() => {
   const {transformApiType} = require('./cmd/transform');
    transformApiType();
  });

// program
//   .command("reload")
//   .description("强制重新拉取资源")
//   .alias("r")
//   .action(() => {
//     const { reload } = require("../lib/cmd/reload");
//     reload();
//   });
program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
// function main () {
//     console.log('当前执行目录:', process.cwd())
// }
// main()