module.exports = {
	"map": {inline: false},
	"plugins": [
		require("postcss-import"),
		require("postcss-url"),
		require('postcss-import-url'),
		// require("postcss-cssnext"),
		require("postcss-discard-comments"),
		require("cssnano"),
	]
};
