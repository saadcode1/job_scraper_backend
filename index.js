import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
import multer from "multer";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import pdfTextExtract from "pdf-text-extract"; // Import pdf-text-extract
import {Job} from "./init/index.js"
import axios from "axios";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: '*', credentials: true }));


// MongoDB Connection
mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => {
  console.log("Connected to MongoDB");
});



// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

let key = "";
let searchKey="";

let jobData;









// Endpoint for file uploads
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    const { file } = req;
    const {search}=req.body;
    searchKey=search;
       
    const options = {
      method: 'GET',
      url: 'https://linkedin-jobs-api2.p.rapidapi.com/active-jb-7d',
      params: {
        title_filter: `${searchKey}`,
       
      },
      headers: {
        'x-rapidapi-key': 'd7f10f1778msh2991fc4d47e77b0p1b2a4djsn9bbb950d98e2',
        'x-rapidapi-host': 'linkedin-jobs-api2.p.rapidapi.com'
      }
    };
    
      const response = await axios.request(options)
	    
	     
      console.log(response,"------------");

      jobData = response.data.map(job => ({
        title: job.title,
        jobPostingUrl: job.url
    }));
    
    console.log(jobData,"-----------------")

      // console.log(jobData,"yes its working");

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Handle PDF and DOCX files differently
    let extractedText = "";
    if (file.mimetype === "application/pdf") {
      console.log(file.path);
      // Use pdf-text-extract to extract text from the PDF
      extractedText = await extractTextFromPdf(file.path);
      

      // Extract keywords (simplified logic for now)
      const keywords = extractedText
        .filter((word) => word.length > 4)
        .slice(0, 20); // Limit to 20 keywords for simplicity
      key = keywords;
      

      // Only send the response after all processing is done
      return res.json({key,jobData});
    } else if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      extractedText = fs.readFileSync(file.path, "utf-8"); // Simplified for docx
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // Ensure extractedText is a string before processing
    if (typeof extractedText !== "string") {
      return res.status(500).json({ error: "Failed to extract text from file" });
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// Extract text from PDF using pdf-text-extract
const extractTextFromPdf = (filePath) => {
  return new Promise((resolve, reject) => {
    pdfTextExtract(filePath, { splitPages: false }, (error, text) => {
      if (error) {
        reject("Error extracting text from PDF: " + error);
      } else {
        resolve(text);
      }
    });
  });
};

const groq = new Groq({ apiKey: process.env.GROQ_API_TOKEN });

async function main() {


  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}
async function getGroqChatCompletion() {
  // Check if jobData has content
  if (!jobData || jobData.length === 0) {
    console.log("No job data available to process.");
    return;
  }

  // Convert the job data into a formatted string for AI
  const formattedJobData = JSON.stringify(jobData, null, 2);

  // Define the content to send to the Groq API
  const content = `
    Here are some available jobs from the provided data:
    note:please provide only json formatted data and dont provide anything no extra thing!

    ${formattedJobData}

    Please provide the job data in the following JSON format:
    {
      "title": "Job Title",
      "jobPostingUrl": "Job URL"
    }
  `;

  // Send the request to Groq API with the formatted content
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: content.trim(),
      },
    ],
    model: "llama-3.1-8b-instant",
  });
}


app.get("/get/job", async (req, res) => {
  try{
    await main();
    const result = await getGroqChatCompletion();
    console.log(result);
  
    res.json({result});
  }
  catch(err){
    console.log("error while fetching jobs using AI",err);
  }
 
});







app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running on PORT", process.env.PORT || 5000);
});
