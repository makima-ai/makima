import { Ollama } from "ollama";

const ollama = new Ollama();

const embeddings = await ollama.embed({
  model: "qwen2.5",
  input: ["Hello, world!", "Hello, different world!"],
});

console.log(embeddings);
