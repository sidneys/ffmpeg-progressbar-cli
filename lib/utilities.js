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
const stringWidth = require('string-width')


/**
 * Get pretty, ellipsis-style file name from file path
 * @param {String} filePath - File path
 * @param {Number} targetLength - File name length before adding ellipsis
 * @returns {String} - File name
 */
let pathToFilenameEllipsis = (filePath, targetLength) => {
    // console.debug('prettyFilenameForFilepath')

    let fileName

    // Format fileName
    const fileExtension = path.extname(filePath)
    const fileTitle = path.basename(filePath, fileExtension)

    // Lengths
    const fileExtensionLength = stringWidth(fileExtension)
    const fileTitleLength = stringWidth(fileTitle)

    // For calculating whether the string should be shortened, incorporate length of extension as well
    if ((fileTitleLength + fileExtensionLength) > targetLength) {
        fileName = `${ellipsize(fileTitle, targetLength - fileExtensionLength)}${fileExtension}`
    } else {
        // filePath.substr(filePath.length - targetLength - 1, filePath.length - 1)
        // fileName = `${fileTitle}${fileExtension}`
        fileName = filePath.substr(filePath.length - targetLength - 1, filePath.length - 1)
    }

    return fileName
}


/**
 * Get 0-padded percentage for fractions
 * @param {String} fraction - Fraction
 * @returns {String} - percentage
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


