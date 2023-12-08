/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { cyan, green, yellow } from 'kolorist'
import prompts from 'prompts'
import { version } from '../package.json'

const argv = yargs(hideBin(process.argv))
  .positional('Folder', {
    type: 'string',
    describe: 'the mode how version range resolves, can be "default", "major", "minor", "latest" or "newest"',
  })
  .options({
    template: {
      type: 'string',
      alias: 't',
      choices: ['basic', 'vue', 'angular'] as const,
      demandOption: false,
      description: 'Specify a template that you want.',
    },
  })
  .showHelpOnFail(false)
  .alias('h', 'help')
  .version('version', 'Outputs ltns version', version)
  .alias('v', 'version')
  .help()
  .parseSync()

console.log(argv)

type ColorFunc = (str: string | number) => string

interface Template {
  name: string
  detail: string
  color: ColorFunc
}

const templates: Template[] = [
  {
    name: 'basic',
    detail: 'Basic (Vite, Scss)',
    color: green,
  },
  {
    name: 'vue',
    detail: 'Vue (Vite, TypeScript)',
    color: cyan,
  },
  {
    name: 'angular',
    detail: 'Angular',
    color: yellow,
  },
]

const defaultTargetDir = 'project'

const TEMPLATES = templates.map(tempate => tempate.name)

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
}

async function run() {
  if (
    argv._.length === 0 && (argv.v || argv.version)
  ) {
    const pkgPath = getPath('package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    console.log(pkg.version)

    process.exit(0)
  }

  const argTargetDir = formatTargetDir(argv._[0] as string)
  const argTemplate = argv.t as string || argv.template

  let targetDir = argTargetDir || defaultTargetDir

  let result: prompts.Answers<'projectName' | 'overwrite' | 'overwriteCheck' | 'template'>

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'toggle',
          name: 'overwrite',
          initial: true,
          message: `Target directory ${targetDir} is not empty. Do you want to overwrite it?`,
          inactive: 'no',
          active: 'yes',
        },
        {
          type: (_, { overwrite }: { overwrite: boolean }) => {
            if (overwrite === false)
              throw new Error('😑 Operation canceled')

            return null
          },
          name: 'overwriteCheck',
        },
        {
          type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'template',
          message: () => {
            return argTemplate && !TEMPLATES.includes(argTemplate)
              ? `${argTemplate} is not a valid template. Please choose from below:`
              : 'Select a template'
          },
          choices: templates.map((template) => {
            return {
              title: template.color(template.detail),
              value: template.name,
            }
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error('😑 Operation canceled')
        },
      },
    )
  }
  catch (error: any) {
    console.log(error.message)
    return
  }

  const { overwrite, template } = result

  const root = path.join(process.cwd(), targetDir)

  if (overwrite)
    emptyDir(root)
  else if (!fs.existsSync(root))
    fs.mkdirSync(root)

  const targetTemplate = template || argTemplate
  const templateDir = getPath(`template-${targetTemplate}`)

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content)
      fs.writeFileSync(targetPath, content)
    else
      copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter(f => f !== 'package.json'))
    write(file)

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  )

  pkg.name = targetDir

  write('package.json', JSON.stringify(pkg, null, 2))

  console.log(`\nDone. Now run:\n`)
  console.log(` cd ${targetDir}`)
  console.log(' npm install')
  console.log(' npm run dev')
}

function isEmpty(dir: string) {
  const files = fs.readdirSync(dir)
  return files.length === 0
}

// not
function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim()
    .replace(/\/+/g, '')
    .replace(/[.]/g, '')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir))
    return

  const files = fs.readdirSync(dir)
  for (const file of files)
    fs.rmSync(path.join(dir, file), { recursive: true })
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)
  else
    fs.copyFileSync(src, dest)
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir)
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file)
    const destFile = path.join(destDir, file)
    copy(srcFile, destFile)
  }
}

function getPath(file: string) {
  return path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    file,
  )
}

run().catch((e) => {
  console.log(e)
})
