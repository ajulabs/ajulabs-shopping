module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@ajulabs/types': '../../packages/types/src',
            '@ajulabs/theme': '../../packages/theme/src',
            '@ajulabs/api-client': '../../packages/api-client/src',
          },
        },
      ],
    ],
  };
};