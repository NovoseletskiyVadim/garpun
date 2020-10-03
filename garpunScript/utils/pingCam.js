var exec = require('child_process').exec;
function puts(error, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
}
exec('ping 10.15.40.18', puts);
