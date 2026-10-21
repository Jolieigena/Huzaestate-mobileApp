// Which HuzaEstate the app shows while developing. Change it with:  npm run target:server   or   npm run target:local
//   server  the deployed site and its real database (the same listings, accounts and orders as huzaestate.com)
//   local   the website and backend running on this computer (Docker), whose database holds only test data
// Release builds always use the deployed site, whatever this says.
export const TARGET: 'server' | 'local' = 'server';

// The page the app opens on while developing, for jumping straight to the screen being worked on (for example '/login' or
// '/manager'). Leave it as '/' normally; release builds always open the home page.
export const START_PATH = '/';
