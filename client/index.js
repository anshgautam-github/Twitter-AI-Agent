//MCP CLient works with the import ones instead of require ones 
import { config } from 'dotenv';
import readline from 'readline/promises'
import { GoogleGenAI } from "@google/genai"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"

config();
let tools=[]; 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const mcpClient= new Client({
    name:"example-client",
    version:"1.0.0",
})

//to maintain the chat history
const chatHistory=[];
const rl=readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})



//transport wahi h jisse client and server connect krte hn
//in dono ko connect krne ke baad -> acess rheta h woh sare resources and tools ka jo backend pe create kiye hn 
mcpClient.connect(new SSEClientTransport(new URL("http://localhost:3001/sse")))
         .then(async ()=>{
            console.log("connected to the MCP server");
            //now this tool we have on the MCP server, we have to tell to AI so it can use those tools 
            tools=(await mcpClient.listTools()).tools.map(tool=>{
                return {
                    name: tool.name,
                    description: tool.desription,
                    parameters:{
                        type: tool.inputSchema.type,
                        properties: tool.inputSchema.properties,
                        required: tool.inputSchema.required
                    }
                }
            });
            chatLoop();

         })

//function that will continously asks the user input and that input it will feed into AI
//So in this continous chat will be formed 

async function chatLoop(toolCall){

    if(toolCall){
        console.log("Calling tool", toolCall.name);
        
        chatHistory.push({
            role: "model",
            parts: [
                {
                    text: `calling tool ${toolCall.name}`,
                    type: "text"
                }
            ]
        })

        const toolResult= await mcpClient.callTool({
            name: toolCall.name,
            arguments:toolCall.args
        })
        
        //now we have to feed this result of the toolCAll in the chatHistory
        chatHistory.push({
            role: "user",
            parts: [
                {
                    text: "Tool result : " + toolResult.content[ 0 ].text,
                    type: "text"
                }
            ]
        })
    }else {
        const question = await rl.question('You: ');
        chatHistory.push({
            role: "user",
            parts: [
                {
                    text: question,
                    type: "text"
                }
            ]
        })
    }

    const response= await ai.models.generateContent({
        model:"gemini-2.0-flash",
        contents: chatHistory,
        config:{
            tools:[
                {
                    functionDeclarations: tools,
                }
            ]
        }
    })

    const functionCall=response.candidates[0].content.parts[ 0 ].functionCall
    const responseText=response.candidates[0].content.parts[ 0 ].text

    if(functionCall){
        return chatLoop(functionCall);
    }


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



//in this whole issue is - if we ask to post a twitter post on my accounnt
//it does not have that capability
//so here we willt take help of the MCP server , and we will conect this 
//client to the MCP server