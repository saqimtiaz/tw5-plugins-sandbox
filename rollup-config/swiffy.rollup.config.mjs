import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const config = {
	output: {
		format: 'umd',
	},
	plugins: [nodeResolve(), commonjs(), terser()],
};

export default config;