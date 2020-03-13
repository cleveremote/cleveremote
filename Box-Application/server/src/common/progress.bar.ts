import * as cliProgress from 'cli-progress';
import * as _colors from 'colors';

// create new container
export let multibar = new cliProgress.MultiBar({
    format: 'CLI Progress |' + _colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    noTTYOutput: true
}, cliProgress.Presets.shades_grey);