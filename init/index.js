import mongoose from "mongoose";
import { jobData } from "./jobs.js";
import dotenv from "dotenv";
dotenv.config();


// // MongoDB Connection
// mongoose.connect(process.env.MONGO_DB_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
  
//   const db = mongoose.connection;
//   db.once("open", () => {
//     console.log("Connected to MongoDB");
//   });

// Job Schema
const jobSchema = new mongoose.Schema({
    job_title: String,
    company_name: String,
    job_description: String,
    application_link: String,
  });
  
 export const Job = mongoose.model("Job", jobSchema);


//   const addJobs= async()=>{
//      const res=await Job.insertMany(jobData);

//      console.log(res,"data was saved");
//   }

//   addJobs();


