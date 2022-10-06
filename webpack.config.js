const path = require('path');
// const version = require('./package.json').version;
const SveltePreprocess = require('svelte-preprocess');

// Custom webpack rules
const rules = [
    { test: /\.ts$/, loader: 'ts-loader' },
    {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'source-map-loader'
    },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    {
        test: /\.svelte$/,
        loader: 'svelte-loader',
        options: {
            preprocess: SveltePreprocess({
                postcss: {
                    plugins: [require('tailwindcss'), require('autoprefixer')]
                }
            })
        }
    },
    {
        test: /\.svg$/,
        loader: 'svg-url-loader'
    }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = [
    '@jupyter-widgets/base',
    '@jupyterlab/notebook',
    '@lumino/widgets'
];

const resolve = {
    extensions: [
        '.webpack.js',
        '.web.js',
        '.ts',
        '.js',
        '.svelte',
        '.css',
        '.svg'
    ],
    mainFields: ['svelte', 'browser', 'module', 'main']
};

module.exports = [
    /**
     * Lab extension
     *
     * This builds the lib/ folder with the JupyterLab extension.
     */
    {
        entry: './src/index.ts',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'lib'),
            libraryTarget: 'amd',
            publicPath: ''
        },
        module: {
            rules: rules
        },
        externals,
        resolve,
        ignoreWarnings: [/Failed to parse source map/]
    }
];
