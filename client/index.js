const readline= require('readline/promises');


//to do the AI integration
const { GoogleGenAI } =require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();

//to maintain the chat history
const chatHistory=[];
const rl=readline.createInstance({
    input: process.stdin,
    output: process.stdout,
})

//function that will continously asks the user input and that input it will feed into AI
//So in this continous chat will be formed 

async function chatLoop(){
    const question= await rl.question('You: ');
}