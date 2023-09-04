const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const express = require('express');
const app = express();

// Use the provided port from the environment variable or a default port
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://apiuser:jiDFy6Jtk5AUz6D6@cluster0.sfztsa4.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// Define a schema for the data you want to store
const DataSchema = new mongoose.Schema({
  average_polarity: Number,
  tag: String,
  timestamp: String,
});
const DataModel = mongoose.model('Data', DataSchema);

// Define the API URLs for different tags
const apiUrls = {
  bitcoin: 'https://tag-sentiment-analyzis-f1a8b1ab8876.herokuapp.com/average_polarity?tag=bitcoin',
  dogecoin: 'https://tag-sentiment-analyzis-f1a8b1ab8876.herokuapp.com/average_polarity?tag=dogecoin',
  ethereum: 'https://tag-sentiment-analyzis-f1a8b1ab8876.herokuapp.com/average_polarity?tag=ethereum',
};

// Function to perform the cron job logic for a given tag
async function performCronJob(tag) {
  try {
    // Make a request to the API for the specified tag
    const apiUrl = apiUrls[tag];
    const response = await axios.get(apiUrl);

    // Extract the data from the response
    const { average_polarity, tag: responseTag, timestamp } = response.data;

    // Create a new document in MongoDB
    const newData = new DataModel({
      average_polarity,
      tag: responseTag,
      timestamp,
    });

    // Save the document to the database
    await newData.save();

    console.log(`Data saved to MongoDB for tag "${responseTag}":`, newData);
  } catch (error) {
    console.error(`Error for tag "${tag}":`, error.message);
  }
}

// Schedule cron jobs for each tag
cron.schedule('0 * * * *', () => performCronJob('bitcoin'));
cron.schedule('0 * * * *', () => performCronJob('dogecoin'));
cron.schedule('0 * * * *', () => performCronJob('ethereum'));

// Handle MongoDB connection errors
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

// Define an endpoint to trigger the cron job manually for a specific tag
app.get('/trigger-cron/:tag', (req, res) => {
  const { tag } = req.params;
  if (apiUrls[tag]) {
    // Trigger the cron job manually for the specified tag
    performCronJob(tag);
    res.send(`Cron job for tag "${tag}" triggered manually.`);
  } else {
    res.status(400).send(`Tag "${tag}" not found.`);
  }
});

// Start the Express.js server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
