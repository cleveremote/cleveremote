const cliProgress = require('cli-progress');

const _colors = require('colors');

// create new container
export let multibar = new cliProgress.MultiBar({
    format: 'CLI Progress |' + _colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
}, cliProgress.Presets.shades_grey);