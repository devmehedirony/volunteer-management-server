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

const NeedVolunteerCollections = client.db("NeedvolunteerPosts").collection('posts')
const VolunteerCollections = client.db("volunteerPosts").collection('requested')

async function run() {
  try {

    app.post('/need-volunteer-posts', async (req, res) => {
      const posts = req.body
      const result = await NeedVolunteerCollections.insertOne(posts)
      res.send(result)
})
   
    app.get('/need-volunteer-posts', async (req, res) => {
      const search = req.query.search
      const email = req.query.email

      let query = {}
      if (search) {
        query = {
          PostTitle: {
            $regex: search,
            $options: 'i'
          }
        }
      }
      
      if (email) {
        query = {
          organizerEmail: email
        }
      }
      const data = await NeedVolunteerCollections.find(query).toArray()
      res.send(data)
    })

    app.get('/need-volunteer-posts/details/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await NeedVolunteerCollections.findOne(query)
      res.send(result)
    })

    app.post('/be-a-volunteer', async (req, res) => {
      const requestVolunteer = req.body
      const result = await VolunteerCollections.insertOne(requestVolunteer)

     res.send(result)
    })

    app.get('/be-a-volunteer', async (req, res) => {
      const email = req.query.email
      const query = { volunteerEmail : email}
      const result = await VolunteerCollections.find(query).toArray()
      res.send(result)
    })
    app.patch('/volunteers-needed/:id', async (req, res) => {
      const id  = req.params.id
      const query = { _id: new ObjectId(id) }
      
      const updatedNeedVolunteer = { $inc: { volunteersNeeded: -1 } }
      const result = await NeedVolunteerCollections.updateOne(query,updatedNeedVolunteer)
      
      res.send(result)
    })



  } finally {
    
  }
}
run().catch(console.dir);
