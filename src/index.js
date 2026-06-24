function hello(name = "AA-CQ") {
  return `Hello, ${name} reports are ready.`;
}

if (require.main === module) {
  console.log(hello());
}

module.exports = {
  hello
};
