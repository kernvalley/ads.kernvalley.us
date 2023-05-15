/* eslint-env node */
import pcImport from 'postcss-import';
import pcURL from 'postcss-url';
import pcImportURL from 'postcss-import-url';
import pcEnv from 'postcss-preset-env';
import pcDiscardComments from 'postcss-discard-comments';
import pcCustomProperties from 'postcss-custom-properties';
import pcMediaMinMax from 'postcss-media-minmax';
import CSSNano from 'cssnano';
import postcssNesting  from 'postcss-nesting';
export default {
	map: {inline: false},
	plugins: [
		pcImport, pcURL,pcImportURL, pcEnv, pcDiscardComments, pcCustomProperties,
		pcMediaMinMax, CSSNano, postcssNesting
	]
};
