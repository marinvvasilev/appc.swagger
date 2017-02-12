const test = require('tape');
const tapDiff = require('tap-diff');

test.createStream()
  .pipe(tapDiff())
  .pipe(process.stdout)
