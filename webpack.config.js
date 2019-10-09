const path = require('path');

module.exports = (env, argv) => {
    return {
        entry: {
            amadeus: './index.js'
        },
        output: {
            // hard file name
            // we'll be using cache instead of hard versioning
            filename: 'amadeus.js',
            path: path.join(__dirname, './dist'),
            libraryTarget: 'commonjs'
        },
        optimization: {
            minimize: false
        }
    };
};
