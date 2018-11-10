'use strict'


/**
 * Modules
 * External
 * @constant
 */
const chalk = require('chalk')

/**
 * @namespace chalk
 * @function chalk.rgb
 */

/**
 * @module theme
 */
module.exports = {
    filenameLabel: chalk.rgb(180, 255, 220),
    filename: chalk.rgb(0, 255, 155).bold,
    beam: chalk.rgb(64, 0, 255),
    percentage: chalk.rgb(226, 217, 255),
    etaLabel: chalk.rgb(255, 180, 150),
    eta: chalk.rgb(255, 55, 0).bold,
    prompt: chalk.rgb(255, 230, 0).bold,
    error: chalk.rgb(255, 0, 0).bold,
    warning: chalk.rgb(255, 165, 0).bold
}

