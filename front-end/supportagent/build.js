import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBuild() {
  console.log('Building Customer Support React bundle...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/main.jsx')],
    bundle: true,
    outfile: path.resolve(__dirname, 'dist/bundle.js'),
    format: 'iife',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    sourcemap: false,
  });
  console.log('✅ Customer Support React bundle built successfully in dist/bundle.js');
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
