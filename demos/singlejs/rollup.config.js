import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'build/amazon-chime-sdk.min.js',
      format: 'umd',
      name: 'ChimeSDK',
      sourcemap: true,
    },
  ],
  plugins: [resolve(), commonjs(), terser()],
  onwarn: (warning, next) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      // TODO: Fix https://github.com/aws/amazon-chime-sdk-js/issues/107
      return;
    } else if (warning.code === 'EVAL') {
      return;
    }
    next(warning);
  },
};
