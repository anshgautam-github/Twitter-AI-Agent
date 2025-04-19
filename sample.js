
require("dotenv").config();
const readline= require('readline/promises');


//Configuring GEMINI
const { GoogleGenAI } =require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//to maintain the chat history
const chatHistory=[];
const rl=readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})


//function that will continously asks the user input and that input it will feed into AI
//So in this continous chat will be formed 

async function chatLoop(){
    const question= await rl.question('You: ');

    chatHistory.push({
        role:"user",
        parts:[
            {
                text:question,
                type:"text"
            }
        ]
    })

    const response= await ai.models.generateContent({
        model:"gemini-2.0-flash",
        contents: chatHistory
    })

    const responseText=response.candidates[0].content.parts[ 0 ].text
    chatHistory.push({
        role:"model",
        parts:[
            {
                text:responseText,
                type:"text"
            }
        ]
    })

    console.log(`AI: ${responseText}`);
    chatLoop();
}

chatLoop();


//in this whole issue is - if we ask to post a twitter post on my accounnt
//it does not have that capability
//so here we willt take help of the MCP server , and we will conect this 
//client to the MCP server