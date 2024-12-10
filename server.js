/************************************************************************************************ 
 * ITE5315 – Project * 
 * I declare that this assignment is my own work in accordance with Humber Academic Policy. 
 * No part of this assignment has been copied manually or electronically from any other source 
 *  (including web sites) or distributed to other students.
 * Name: Pranav Panchal, Mitali Sisodia 
 * Student ID: N01609997, N01621572
 * Date: 10th Dec 2024 
 ************************************************************************************************/

const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Server Configuration
const PORT = 3000; // You can set your desired port here

// MongoDB Configuration
const uri = process.env.MONGO_URI; // Use the environment variable for MongoDB URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Test MongoDB Connection
async function connectToMongoDB() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

connectToMongoDB();

// Define API Endpoints
app.get('/', (req, res) => {
  res.send('API is running!');
});

// Sample route for fetching data
app.get('/sample-data', async (req, res) => {
  try {
    const db = client.db("sample_restaurants"); 
    const collection = db.collection("restaurants"); 
    const data = await collection.find({}).limit(10).toArray(); 
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching data", details: err.message });
  }
});

// Create a new restaurant
app.post('/restaurants', async (req, res) => {
  try {
    const { name, cuisine, location, rating, priceRange } = req.body;

    if (!name || !cuisine || !location || !rating || !priceRange) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    const newRestaurant = {
      name,
      cuisine,
      location,
      rating,
      priceRange,
      createdAt: new Date()
    };

    await collection.insertOne(newRestaurant);
    res.status(201).json(newRestaurant); 
  } catch (err) {
    res.status(500).json({ error: 'Error creating restaurant', details: err.message });
  }
});

// Get paginated and filtered restaurants
app.get('/restaurants/paginated', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const perPage = parseInt(req.query.perPage) || 10; // Default to 10 items per page
    const borough = req.query.borough; // Optional filter by borough

    const skip = (page - 1) * perPage; // Calculate how many documents to skip

    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    let query = {}; // Default query (no filters)
    if (borough) {
      query.borough = borough; // Add borough filter if provided
    }

    // Fetch paginated and filtered results
    const restaurants = await collection.find(query)
      .sort({ restaurant_id: 1 }) // Sort by restaurant_id
      .skip(skip) // Skip documents for pagination
      .limit(perPage) // Limit to the number of documents per page
      .toArray();

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching paginated restaurants', details: err.message });
  }
});


// Get all restaurants
app.get('/restaurants', async (req, res) => {
  try {
    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    const restaurants = await collection.find({}).toArray();
    res.json(restaurants); // Send all restaurants as response
  } catch (err) {
    res.status(500).json({ error: 'Error fetching restaurants', details: err.message });
  }
});

// Get a specific restaurant by ID
app.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurantId = req.params.id;

    // Convert the string ID into a MongoDB ObjectId
    const objectId = new ObjectId(restaurantId);

    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    const restaurant = await collection.findOne({ _id: objectId });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching restaurant', details: err.message });
  }
});

// Update an existing restaurant by ID
app.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { name, cuisine, location, rating, priceRange } = req.body;

    if (!name || !cuisine || !location || !rating || !priceRange) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    const updatedRestaurant = await collection.findOneAndUpdate(
      { _id: new ObjectId(restaurantId) },
      {
        $set: { name, cuisine, location, rating, priceRange }
      },
      { returnDocument: 'after' } // Return the document after the update
    );

    if (!updatedRestaurant.value) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(updatedRestaurant.value); // Send the updated restaurant as response
  } catch (err) {
    res.status(500).json({ error: 'Error updating restaurant', details: err.message });
  }
});

// Delete a restaurant by ID
app.delete('/restaurants/:id', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const db = client.db("sample_restaurants");
    const collection = db.collection("restaurants");

    const deleteResult = await collection.deleteOne({ _id: new ObjectId(restaurantId) });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting restaurant', details: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
