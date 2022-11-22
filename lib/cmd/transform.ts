const fs = require('fs-extra');
const path = require('path');
const child_process = require('child_process');
const util = require('util');
import { ApiConfig } from "./type";

const config = require(path.join(process.cwd(), './apiSync.config.json'));
const outputPath = path.join(process.cwd(), config.outputPath);
const apiConfigPath = path.join(process.cwd(), config.apiConfigPath);
const tsDocPath = path.join(process.cwd(), config.tsDocPath);

export async function transformApiType(): Promise<void> {
  const apiConfigData = await readFile(apiConfigPath);
  const pureScript = deleteComment(apiConfigData.replace('export const _apis', 'global.apiConfig'));
  eval(pureScript);
  await swagger2Ts(config.swaggerDocUrl, tsDocPath);
  const apiTypeStr = generateApiType((global as any).apiConfig);
  await writeFile(outputPath, `${apiTypeStr}\n`);
  const apiTypeObj = generateApiMapObj((global as any).apiConfig);
  // test
  // const apiTypeObj = generateApiMapObj({
  //   store: {
  //     // 我的卖场列表
  //     outletList: '/lotus/outlet/mpg/v2/outletList', // 团长的卖场列表
  //     update: '/lotus/outlet/mpg/v1/update', // 创建编辑
  //     // 运费模板相关
  //     delivery: {
  //       create: '/lotus/outlet/mpg/mgr/v2/delivery/create', // 创建运费模版
  //       update: '/lotus/outlet/mpg/mgr/v2/delivery/update', // 更新运费模板
  //     },
  //   },
  // });
  await generateApiMap(apiTypeObj);
}

async function readFile(path: string): Promise<string> {
  try {
    const data = await fs.readFile(path, { encoding: 'utf-8' });
    console.log(`读取API配置文件 ${path} success`);
    return data;
  } catch (e) {
    console.log(`读取API配置文件 ${path} failed：`, e);
    return ''
  }
}

async function writeFile(path: string, content: string): Promise<void> {
  try {
    await fs.writeFile(path, `${content}\n`, { encoding: 'utf-8' });
    console.log(`写入API请求type到文件 ${path} success`);
  } catch (e) {
    console.log(`写入API请求type到文件 ${path} failed：`, e);
  }
}

async function swagger2Ts(swaggerDocUrl: string, tsDocPath: string): Promise<void> {
  try {
    const exec = util.promisify(child_process.exec);
    await exec(`npx openapi-typescript ${swaggerDocUrl} --output ${tsDocPath}`);
    console.log('swagger文档转换ts success')
  } catch (e) {
    console.log('swagger文档转换ts failed：', e);
  }
}

// 删除apiSync.config.json文件中的注释
function deleteComment(script: string): string {
  const reg = /("([^\\"]*(\\.)?)*")|('([^\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n|$))|(\/\*(\n|.)*?\*\/)/g;
  return script.replace(reg, function (word) {
    return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? '' : word;
  });
}

// 生成每个请求的类型
function generateApiType(apiConfig: ApiConfig): string {
  let apiTypeStr = `import { paths } from "./api-type-ori";\nimport { _apis } from './apis-url';\n\n`;
  function tranverse(apiConfig: ApiConfig): void {
    for (const [name, value] of Object.entries(apiConfig)) {
      if (typeof value === 'string' || typeof (value as { url: string }).url === 'string') {
        const urlPath = value.hasOwnProperty('url') ? (value as {url: string}).url : value;
        apiTypeStr += `type ${name} = (
          params?: paths['${urlPath}']['post']['parameters']['body']['request'],
        ) => Promise<paths['${urlPath}']['post']['responses'][200]['schema']>;\n`;
      } else {
        tranverse(value);
      }
    }
  }
  tranverse(apiConfig);
  return apiTypeStr;
}

// 生成每个url与请求类型的映射
function generateApiMapObj(config: ApiConfig): object {
  const apiType = JSON.parse(JSON.stringify(config));
  function tranverse(apiConfig: any): void {
    for (const [name, value] of Object.entries(apiConfig)) {
      if (typeof value === 'string' || typeof (value as { url: string }).url === 'string') {
        apiConfig[name] = name;
      } else {
        apiConfig[name] = tranverse(apiConfig[name]);
      }
    }
    return apiConfig;
  }
  tranverse(apiType);
  return apiType;
}

// 将对象转换成string，并写入文件
async function generateApiMap(obj: object): Promise<void> {
  try {
    const str = JSON.stringify(obj, null, '\t').replace(/"/g, '').replace(/,/g, ';');
    await fs.appendFile(outputPath, `export type apiType = ${str}`, { encoding: 'utf-8' });
    console.log(`写入URL和请求type映射关系到文件 ${outputPath} success`);
  } catch (e) {
    console.log(`写入URL和请求type映射关系到文件 ${outputPath} failed：`, e);
  }
}
