// modify from https://github.com/vitejs/vite/blob/main/packages/create-app/index.js
import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import { prompt } from 'enquirer'
import { green, blue, stripColors, magenta } from 'kolorist'

const argv = minimist(process.argv.slice(2))

const cwd = process.cwd()

// prettier-ignore
const TEMPLATES = [
  blue('farrow-only'),
  green('farrow-vite-react'),
  magenta('farrow-next-react')
]

const renameFiles = {
  _gitignore: '.gitignore',
}

type ValidTemplate = {
  isValid: true
  template: string
}

type InvalidTemplate = {
  isValid: false
  isEmpty?: boolean
  message: string
}

type TemplateStatus = ValidTemplate | InvalidTemplate

const validateTemplate = (template: unknown): TemplateStatus => {
  if (typeof template !== 'string') {
    return {
      isValid: false,
      isEmpty: true,
      message: `Expected template to be a string, instead of ${template}`,
    }
  }

  let availableTemplates = TEMPLATES.map(stripColors)

  if (availableTemplates.includes(template)) {
    return {
      isValid: true,
      template,
    }
  }

  return {
    isValid: false,
    message: `Unexpected template: ${template}, the available templates are ${availableTemplates.join(', ')}`,
  }
}

async function init() {
  let targetDir = argv._[0]

  if (!targetDir) {
    let { name } = await prompt<{ name: string }>({
      type: 'input',
      name: 'name',
      message: `Project name:`,
      initial: 'farrow-project',
    })
    targetDir = name
  }

  let root = path.join(cwd, targetDir)
  console.log(`\nScaffolding project in ${root}...`)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  } else {
    let existing = fs.readdirSync(root)
    if (existing.length) {
      let { yes } = await prompt<{ yes: boolean }>({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message: `Target directory ${targetDir} is not empty.\n` + `Remove existing files and continue?`,
      })
      if (yes) {
        emptyDir(root)
      } else {
        return
      }
    }
  }

  // determine template
  let template = argv.t || argv.template

  let templateStatus = validateTemplate(template)

  if (!templateStatus.isValid) {
    let message = templateStatus.isEmpty
      ? 'Select a template:'
      : `${template} isn't a valid template. Please choose from below:`

    let { t } = await prompt<{ t: string }>({
      type: 'select',
      name: 't',
      message,
      choices: TEMPLATES,
    })
    template = stripColors(t)
  }

  let templateDir = path.join(__dirname, `../templates/${template}`)

  let write = (file: string, content?: string) => {
    let targetPath = renameFiles[file] ? path.join(root, renameFiles[file]) : path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  let files = fs.readdirSync(templateDir).filter((file) => {
    return file !== 'package.json' && !file.includes('node_modules')
  })

  for (let file of files) {
    write(file)
  }

  let pkg = require(path.join(templateDir, `package.json`))

  pkg.name = path
    .basename(root)
    // #2360 ensure packgae.json name is valid
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[~)('!*]+/g, '-')

  write('package.json', JSON.stringify(pkg, null, 2))

  let pkgManager = /yarn/.test(process.env.npm_execpath ?? '') ? 'yarn' : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  ${pkgManager === 'yarn' ? `yarn` : `npm install`}`)
  console.log(`  ${pkgManager === 'yarn' ? `yarn dev` : `npm run dev`}`)
  console.log()
}

function copy(src: string, dest: string) {
  let stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (let file of fs.readdirSync(srcDir)) {
    let srcFile = path.resolve(srcDir, file)
    let destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (let file of fs.readdirSync(dir)) {
    let abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

init().catch((e) => {
  console.error(e)
})
