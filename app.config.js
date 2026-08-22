module.exports = ({ config }) => ({
  ...config,
    scheme: "turax",
  android: {
    ...config.android,
    config: {
      ...(config.android?.config || {}),
      googleMaps: {
        ...(config.android?.config?.googleMaps || {}),
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
});
