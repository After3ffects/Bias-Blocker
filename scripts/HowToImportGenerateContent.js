import { generateContent } from "./prompt.js";


generateContent("Hello").then(result => {
  console.log(result);
});