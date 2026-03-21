const kuromoji = require("kuromoji");
const path = require("path");

const dictPath = path.join(process.cwd(), "node_modules", "kuromoji", "dict");
console.log("Testing kuromoji with dictPath:", dictPath);

kuromoji.builder({ dicPath: dictPath }).build((err, tokenizer) => {
  if (err) {
    console.error("FAILED to build tokenizer:", err);
    process.exit(1);
  }
  
  const text = "こんにちは、世界";
  console.log("Tokenizing:", text);
  const tokens = tokenizer.tokenize(text);
  console.log("Tokens found:", tokens.length);
  tokens.forEach(t => {
    console.log(`- ${t.surface_form} (${t.reading})`);
  });
  process.exit(0);
});
