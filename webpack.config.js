import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  
  return {
    entry: './src/app.js',
    output: {
      filename: 'app.bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: []
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      hot: true,
      // Faster development builds
      watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000,
      },
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      // Faster builds in development
      removeAvailableModules: !isDevelopment,
      removeEmptyChunks: !isDevelopment,
      splitChunks: isDevelopment ? false : {
        chunks: 'all',
      },
    },
    // Faster builds in development
    cache: isDevelopment ? {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    } : false,
    // Skip source maps in development for speed
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
  };
};
