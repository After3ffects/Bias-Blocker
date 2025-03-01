import { generateContent } from "./prompt.js";


generateContent("Tell me a story").then(result => {
  console.log(result);
});