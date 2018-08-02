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
const ellipsize = require('ellipsize')


/**
 * Get pretty, ellipsis-style file name from file path
 * @param {String} filePath - File path
 * @param {Number} maxLength - File name length before adding ellipsis
 * @return {String} - File name
 */
let pathToFilenameEllipsis = (filePath, maxLength) => {
    // console.debug('prettyFilenameForFilepath')

    // Format fileName
    const fileExtension = path.extname(filePath)
    const fileTitle = path.basename(filePath, fileExtension)

    return `${ellipsize(fileTitle, maxLength)}${fileExtension}`
}


/**
 * Get 0-padded percentage for fractions
 * @param {String} fraction - Fraction
 * @return {String} - percentage
 */
let fractionToPercentagePad = (fraction) => {
    // console.debug('fractionToPercentagePad')

    return String(Math.round(fraction * 100)).padStart(2, '0')
}

/**
 * @exports utils
 */
module.exports = {
    pathToFilenameEllipsis: pathToFilenameEllipsis,
    fractionToPercentagePad: fractionToPercentagePad
}


