let port='';

function setPort(Port) {
  port = Port;
}

function getPort() {
  return port;
}
// export { getPort, setPort };
module.exports = { getPort, setPort };