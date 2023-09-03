const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');

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

// Define the API URL
const apiUrl = 'https://tag-sentiment-analyzis-f1a8b1ab8876.herokuapp.com/average_polarity?tag=bitcoin';

// Schedule a task to run every hour
cron.schedule('0 * * * *', async () => {
  try {
    // Make a request to the API
    const response = await axios.get(apiUrl);

    // Extract the data from the response
    const { average_polarity, tag, timestamp } = response.data;

    // Create a new document in MongoDB
    const newData = new DataModel({
      average_polarity,
      tag,
      timestamp,
    });

    // Save the document to the database
    await newData.save();

    console.log('Data saved to MongoDB:', newData);
  } catch (error) {
    console.error('Error:', error.message);
  }
});

// Handle MongoDB connection errors
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

// Start the cron job
console.log('Cron job started. It will run every hour.');
