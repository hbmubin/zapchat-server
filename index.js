const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;


app.use(cors())
app.use(express.json())

app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}))




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const req = require('express/lib/request');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jweumb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db('zapChat').collection('users')
    const conversationsCollection = client.db('zapChat').collection('conversationsCollection')

    app.post('/jwt', (req, res) => {
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ token })
    })

    const verifyToken = (req, res, next) => {
      // console.log(req.headers)
      if(!req.headers.authorization) {
        return res.status(401).send({message: 'access forbidden'})
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(403).send({message: 'access forbidden'})
        }
        // console.log(`inside verify token ${token}`) 
        req.decoded = decoded
        next()
      })

    }

    app.post('/users', async(req, res)=>{
        const user = req.body
        const query = {email: user.email}
        const ifExist = await usersCollection.findOne(query)
        if(ifExist){
            return res.send({message: 'already exist'})
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
    })
    
    app.delete('/users/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {userId: id}
        const result = await usersCollection.deleteOne(query)
        res.send(result)
    })

    app.get('/my-info/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {userId: id}
        const result = await usersCollection.findOne(query)
        res.send(result)
    })


    app.patch('/my-info/image/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {userId: id}
        const newValues = { $set: {photoURL: req.body.photoURL}}
        const result = await usersCollection.updateOne(query, newValues)
        res.send(result)
    })

    app.patch('/my-info/name/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {userId: id}
        const newValues = { $set: {name: req.body.name}}
        const result = await usersCollection.updateOne(query, newValues)
        res.send(result)
    })

    app.patch('/my-info/des/:id', verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {userId: id}
        const newValues = { $set: {des: req.body.des}}
        const result = await usersCollection.updateOne(query, newValues)
        res.send(result)
    })

  app.get("/users/:id", async (req, res) => {
    const id = req.params.id;
    const query = { userId: id };
    const result = await usersCollection.findOne(query, {
      projection: { name: 1, email: 1, photoURL: 1, userId: 1, status: 1 },
    });
    res.send(result);
  });

  app.get("/my-conversations/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const query = { members: id };
    const result = await conversationsCollection.find(query).toArray();
    res.json(result);
  });
  
  app.patch('/chat/:id', verifyToken, verifyToken, async (req, res) => {
    const id = req.params.id;
    const message = req.body;
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $push: { messages: message },
    };
    const result = await conversationsCollection.updateOne(query, updateDoc);
    res.send(result);
  });
  
  
  



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('ZapChat is Running!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});