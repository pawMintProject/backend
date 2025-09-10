import express from 'express';

import crypto from 'crypto';
import cors from "cors"
import requestIp from 'request-ip';

import dotenv from "dotenv"
const app = express();

app.use(cors())
app.use(requestIp.mw())



app.use("/files", express.static("assets"))

import multer from 'multer';
import path from 'path';

import axios from 'axios';


// const storage = multer.diskStorage({
//     destination: 'assets/',
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });
  
//   // multer setup with limits and storage
//   const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
//   });
  
  // Post endpoint to handle file upload
//   app.post('/upload', upload.single('image'), (req, res, next) => {
//     // Check if file is uploaded
//     if (!req.file) {
//       return res.status(400).send({ message: 'No file uploaded' });
//     }
  
//     const uploadedFile = req.file;
  
//     // Generate a download link for the uploaded file
//     const downloadLink = `${req.protocol}://${req.get('host')}/files/${uploadedFile.filename}`;
  
//     // Send the download link as a response
//     res.status(200).send(downloadLink);
//   });


export const jwtSecret = "46738bde8d80cb4a954b5eb917a529d40ef8a2c7dd556dbc8e5053de0dceec6ac7748510693eeaa1b9902819bb46e95d3da44dec3c0571eaadc12fdbf7752eee";

app.use(express.json())



dotenv.config();



const generateOtp = () => {
    return crypto.randomInt(1000, 9999).toString();
}
export function ExpireOtp(phone) {
    otpStore[phone] = {}
}
export let otpStore = {}




const port = process.env.port || 3000;
app.get("/",(req,res)=>{
    res.send("dwd")
})
export const exServer = app.listen(port, () => {
    console.log(`listening on ${port}`);
})
