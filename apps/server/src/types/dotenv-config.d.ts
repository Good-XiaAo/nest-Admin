// dotenv v18 exposes "./config" (dist/config.cjs) through package.json "exports"
// but ships no type declaration for that subpath -- v17 had a config.d.ts marker
// file next to config.js. With moduleResolution "nodenext" +
// resolvePackageJsonExports, TypeScript therefore cannot resolve the side-effect
// import in src/main.ts ("Cannot find module 'dotenv/config'"). Declaring the
// module here is enough: it is only imported for its side effect, never bound.
declare module 'dotenv/config';
