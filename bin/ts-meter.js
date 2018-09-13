#!/usr/bin/env node

const glob = require('glob-promise')
const path = require('path')
const program = require('commander')
const chalk = require('chalk')
const sloc = require('sloc')
const fs = require('fs')

program
  .usage('[options] <directory>')
  .option(
    '-f, --fast',
    'count files instead of lines of code',
  )
  .parse(process.argv)

if (program.args.length !== 1) {
  program.help()
}

const { fast, args: [ directory ] } = program

tsMeter(directory)

function linesOfCodeInFile (file, language) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, code) => {
      if (err) {
        return reject(err)
      }

      const stats = sloc(code, language)
      return resolve(stats.source)
    })
  })
}

async function linesOfCode (files, language) {
  const array = await Promise.all(files.map(file => linesOfCodeInFile(file, language)))
  return array.reduce((a, b) => a + b, 0)
}

async function tsMeter (directory) {
  const jsWildcard = path.join(directory, '/**/*.{js,jsx}')
  const tsWildcard = path.join(directory, '/**/*.{ts,tsx}')
  const jsFiles = await glob(jsWildcard)
  const tsFiles = await glob(tsWildcard)

  const jsResult = fast
    ? jsFiles.length
    : await linesOfCode(jsFiles, 'js')
  const tsResult = fast
    ? tsFiles.length
    : await linesOfCode(tsFiles, 'ts')

  const total = jsResult + tsResult
  const typeScriptification = (tsResult / total) * 100

  console.log(`\n  TypeScriptification rate is ${chalk.blue(typeScriptification.toFixed(2) + '%')}\n`)
}
