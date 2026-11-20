module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: [
            '.ios.js',
            '.android.js',
            '.ios.jsx',
            '.android.jsx',
            '.js',
            '.jsx',
            '.json',
            '.ts',
            '.tsx',
          ],
          root: ['.'],
          alias: {
            '@Assets': './src/assets',
            '@Components': './src/components',
            '@Utils': './src/lib',
            '@Lib': './src/lib',
            '@Hooks': './src/hooks',
            '@Types': './src/types',
            '@Api': './src/api',
            '@Store': './src/store',
            '@Screens': './src/screens',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        {
          path: '.env',
          safe: true,
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
