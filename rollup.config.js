import urlResolve from 'rollup-plugin-url-resolve';
import {terser} from 'rollup-plugin-terser';

export default {
	input: 'js/index.js',
	output: {
		file: 'js/index.min.js',
		format: 'iife',
		sourcemap: true,
	},
	plugins: [
		urlResolve(),
		terser(),
	],
};
