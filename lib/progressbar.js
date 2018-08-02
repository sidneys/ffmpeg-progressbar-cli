'use strict'

/**
 * Modules
 * Node
 * @constant
 */
const path = require('path')

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')
appRootPath.setPath(path.join(__dirname, '..'))
const cliProgress = require('cli-progress')
const colors = require('colors')
const windowSize = require('window-size')


/**
 * Progressbar Width
 * @constant
 * @default
 */
const barWidth = Math.floor(windowSize.get().width - 40)


/** @namespace colors.red */
/** @namespace colors.cyan */

/**
 * Progress Bar
 * @type {Object}
 */
const progressBar = new cliProgress.Bar({
    format: `🔴${colors.red.bold(' {label}')} | ${colors.cyan('{bar}')} | ${colors.red.bold('{percentage}%')} | ${colors.red.bold('ETA {eta_formatted}')}`,
    fps: 20,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    barsize: barWidth,
    etaBuffer: 64,
    stream: process.stdout
}, cliProgress.Presets.shades_grey)


/**
 * Start Progress Bar
 * @param {Number} totalValue - Progress Bar total value
 * @param {String} label - Progress Bar label
 * @public
 */
let startProgressbar = (totalValue, label) => {
    // console.debug('startProgressbar')

    progressBar.start(totalValue, 0, { label: label })
}

/**
 * Update Progress Bar
 * @param {Number} currentValue - Progress Bar current value
 * @public
 */
let updateProgressbar = (currentValue) => {
    // console.debug('updateProgressbar')

    progressBar.update(currentValue)
}


/**
 * @exports progressbar
 */
module.exports = {
    start: startProgressbar,
    update: updateProgressbar
}
