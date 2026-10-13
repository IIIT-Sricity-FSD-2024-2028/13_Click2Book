import esbuild from 'esbuild';

async function runBuild() {
  console.log('Building Customer Support React bundle...');
  await esbuild.build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
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
