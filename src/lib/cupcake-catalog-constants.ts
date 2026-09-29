// Client-safe constants. Kept apart from cupcake-catalog.ts, which imports the
// Mongoose Collection model: importing these from there shipped ~560 KB of
// mongoose to every browser via the header menu.
export const ALL_CUPCAKES_HANDLE = 'all-cupcakes'
export const ALL_CUPCAKES_HREF = `/collections/${ALL_CUPCAKES_HANDLE}`
