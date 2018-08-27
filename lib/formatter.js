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
 * Ellipse character
 * @type {string}
 * @constant
 * @default
 */
const ellipseCharacter = '…'

/**
 * Convert file paths to prettified file name
 * @param {String} filePath - File path
 * @param {Number=} targetLength - File name length before adding ellipsis
 * @returns {String} - File name
 */
let filepathToFilename = (filePath, targetLength = 10) => {
    // console.debug('prettyFilenameForFilepath')

    let fileName

    // Format fileName
    const fileExtension = path.extname(filePath)
    const fileTitle = path.basename(filePath, fileExtension)

    // Lengths
    const fileExtensionLength = stringWidth(fileExtension)
    const fileTitleLength = stringWidth(fileTitle)
    const fileNameLength = fileTitleLength + fileExtensionLength

    /**
     * File name string formatter
     * Handles most edge cases of file name/file extension lengths
     */
    if (fileNameLength > targetLength) {
        if (fileExtensionLength < (targetLength - 2)) {
            // Name too long: ellipse title, leave extension as-is
            // filetit….extension
            fileName = `${ellipsize(fileTitle, targetLength - fileExtensionLength, { ellipse: ellipseCharacter })}${fileExtension}`
        } else {
            // Name too long, extension too long: Ellipse title, hide extension
            // filetit…
            fileName = `${ellipsize(fileTitle, targetLength, { ellipse: ellipseCharacter })}`
        }
    } else if (fileNameLength < targetLength) {
        if (fileNameLength >= (targetLength - 1)) {
            // Name too short by less than 2 characters: pad title left
            //   filetitle.extension
            fileName = `${fileTitle}${fileExtension}`.padStart(targetLength, ' ')
        } else {
            // Name too short by more than 2 characters: Prefix ellipsed directory tree
            // …ocuments/filetitle.extension
            fileName = `${ellipseCharacter}${filePath.substr(filePath.length - targetLength + 1, filePath.length - 1)}`
        }
    } else {
        // File name has perfect length
        fileName = `${fileTitle}${fileExtension}`
    }

    return fileName
}


/**
 * Convert fraction to zero-padded percentage
 * @param {String} fraction - Fraction
 * @param {String=} pad - Pad character
 * @returns {String} - percentage
 */
let fractionToPercentage = (fraction, pad = '0') => {
    // console.debug('fractionToPercentagePad')

    return String(Math.round(fraction * 100)).padStart(3, pad)
}

/**
 * @exports format-string
 */
module.exports = {
    filepathToFilename: filepathToFilename,
    fractionToPercentage: fractionToPercentage
}


