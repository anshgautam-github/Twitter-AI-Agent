
import express from 'express';
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createPost } from "./mcp.tool.js";

//initiating the MCP Server 
const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...
//now this tool we created on the backend -> we can use it on the client
server.tool(
    "addTwoNumbers",
    "Add two numbers",
    {       //we provide schema using zod
        a: z.number(),
        b: z.number()
    },
    async(arg)=>{ //usuallly func in the tool are async
        const {a,b}=arg;
        return {
            content:[ //return type of the tool is different not like a single line return 
            {
                type:"text",
                text:`The sum of ${a} and ${b} is ${a+b}`
            }
        ]}
    }
)

server.tool(
    "createPost",
    "Create a post on X formally known as Twitter ", {
    status: z.string()
}, async (arg) => {
    const { status } = arg;
    return createPost(status);
})


const app = express();




// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};  //we can multile transports for the users

//SSEServerTransport -> it means it follows all the protocols , AI humare client se comunicate kr skta h

//server side event route-> sse server type hota h MCP ka , woh server se communicate krwata h with the help of server side events
//it provides pseudo real time chatting 
//client se server we send with this route 
app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[ transport.sessionId ] = transport;
    res.on("close", () => {
        delete transports[ transport.sessionId ];
    });
    await server.connect(transport);
});


//server to client -> we send from here 
app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[ sessionId ];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});