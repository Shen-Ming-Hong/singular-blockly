//@ts-check

'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
	target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
	},
	externals: {
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vscodeignore file
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'src/mcp/block-dictionary.json', to: 'block-dictionary.json' },
			],
		}),
	],
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
};

/** @type WebpackConfig */
const mcpServerConfig = {
	target: 'node',
	mode: 'none',
	entry: './src/mcp/mcpServer.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'mcp-server.js',
		libraryTarget: 'commonjs2',
	},
	externals: {
		vscode: 'commonjs vscode',
	},
	resolve: {
		extensions: ['.ts', '.js'],
		plugins: [
			{
				// 自訂 resolver：僅對相對/絕對路徑的 .js import 嘗試 .ts 解析
				// 取代全域 extensionAlias 以避免與 SDK exports map 衝突
				apply(resolver) {
					const target = resolver.ensureHook('resolve');
					resolver.getHook('described-resolve').tapAsync('TsJsResolverPlugin', (request, resolveContext, callback) => {
						const req = request.request;
						if (
							typeof req === 'string' &&
							(req.startsWith('./') || req.startsWith('../') || req.startsWith('/')) &&
							req.endsWith('.js')
						) {
							const tsRequest = req.replace(/\.js$/, '.ts');
							resolver.doResolve(
								target,
								{ ...request, request: tsRequest },
								'TsJsResolverPlugin: .js → .ts',
								resolveContext,
								(err, result) => {
									if (result) return callback(null, result);
									return callback(); // fallback to original .js
								}
							);
						} else {
							return callback();
						}
					});
				},
			},
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log',
	},
};

module.exports = [extensionConfig, mcpServerConfig];
