# ffmpeg-progressbar-cli [![npm](https://img.shields.io/npm/v/ffmpeg-progressbar-cli.svg?style=flat-square)](https://npmjs.com/package/ffmpeg-progressbar-cli)

<p align="center">
  <img width="100%" src="https://rawgit.com/sidneys/ffmpeg-progressbar-cli/master/resources/screencasts/screencast-2.gif"/><br>
  <b>ffmpeg-progressbar-cli is a <span style="color: red;">c</span><span style="color: orange;">o</span><span style="color: yellow;">l</span><span style="color: green;">o</span><span style="color: blue;">r</span><span style="color: indigo;">e</span><span style="color: violet;">d</span> progress bar for <a href="https://ffmpeg.org">FFmpeg</a>.</b><br>
  Simply use <code>ffmpeg-bar</code> instead of <code>ffmpeg</code>.<br><br>
</p>


## Contents

1. [Installation](#installation)
1. [Usage](#usage)
1. [Configuration](#configuration)
1. [Requirements](#requirements)
1. [Compatibility](#compatibility)
1. [Contribute](#contribute)
1. [Author](#author)


## <a name="installation"/></a> Installation

```bash
$ npm install --global ffmpeg-progressbar-cli
```


## <a name="usage"/></a> Usage

The installation process adds the `ffmpeg-bar` command to your system.   
This is a transparent wrapper, passing all commands to `ffmpeg`.

To use it, simply launch `ffmpeg-bar` instead of `ffmpeg`, or replace  `ffmpeg` with `ffmpeg-bar` inside your scripts.


As long as no errors are encountered, the output of  `ffmpeg-bar` will   consist of a progress bar, the estimated time until process completion and a percentage.

###### Examples

```bash
$> ffmpeg-bar -i input.mp4 output.avi
```

```bash
$> ffmpeg-bar -i input.avi -b:v 64k -bufsize 64k output.avi
```

```bash
$> ffmpeg-bar -i in.mkv -map_metadata:s:a 0:g out.mkv
```


## <a name="configuration"/></a> Configuration

For configuration purposes, `ffmpeg-progressbar-cli` exposes these environmental variables:


##### `BAR_FILENAME_LENGTH`
The maximum number of characters of the filename label displayed next to the progress bar beam *(default: 20)*

###### Example

```bash
$> BAR_FILENAME_LENGTH=7 ffmpeg-bar -i in.mp4 output.mp4
```

##### `BAR_BEAM_RATIO `

The share of (available) horizontal display real estate the progress bar beam should occupy *(default: 0.75)*

###### Example

```bash
$> BAR_BAR_SIZE_RATIO=0.5 ffmpeg-bar -i in.mp4 output.mp4
```

## <a name="requirements"/></a> Requirements

 - [Node.js](https://nodejs.org/), v8.11 or later
 - [FFmpeg](https://ffmpeg.org/), installed correctly


## <a name="compatibility"/></a> Compatibility

Tested on

 - macOS 10.13, 10.14 Beta
 - Windows 10 1803
 - Ubuntu 18.04


## <a name="contribute"/></a> Contribute ![Contributors Wanted](https://img.shields.io/badge/contributions-wanted-red.svg?style=flat-square)

Read the contribution [documentation](https://github.com/sidneys/ffmpeg-progressbar-cli/blob/master/CONTRIBUTING.md).


## <a name="license"/></a> License

MIT


## <a name="author"/></a> Author

[sidneys](http://sidneys.github.io) 2018

