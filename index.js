require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const app = express()




// middleware
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Server is starting...')
})

app.listen(port, () => {
  console.log(`port is starting...${port}`);
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@rony.exuff.mongodb.net/?retryWrites=true&w=majority&appName=rony`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const VolunteerCollections = client.db("NeedvolunteerPosts").collection('posts')

async function run() {
  try {

    app.post('/need-volunteer-posts', async (req, res) => {
      const posts = req.body
      const result = await VolunteerCollections.insertOne(posts)
      res.send(result)
})
   
    app.get('/need-volunteer-posts', async (req, res) => {
      const data = await VolunteerCollections.find().toArray()
      res.send(data)
    })

    app.get('/need-volunteer-posts/details/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await VolunteerCollections.findOne(query)
      res.send(result)
    })
  } finally {
    
  }
}
run().catch(console.dir);
