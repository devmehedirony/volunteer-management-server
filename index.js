require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000
const app = express()




// middleware
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://volunteer-management-a1a32.web.app',
    ],
  credentials: true
}))
app.use(cookieParser())

const verifyToken = (req, res, next) => {

  const token = req?.cookies?.token
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({message: 'Unauthorized Access'})
    }
    next()
  })
 
}



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



async function run() {
  try {

    const NeedVolunteerCollections = client.db("NeedvolunteerPosts").collection('posts')
    const VolunteerCollections = client.db("volunteerPosts").collection('requested')

    // jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '2d'})
      res
        .cookie(
          'token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          }
        )
        .send({ success: true })
    })

    app.post('/signOut', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true })

    })
    
    // need-volunteer-posts collections
    app.post('/need-volunteer-posts', async (req, res) => {
      const posts = req.body
      const result = await NeedVolunteerCollections.insertOne(posts)
      res.send(result)
})
   
    app.get('/need-volunteer-posts', async (req, res) => {
      const search = req.query.search
      const sort = req.query.sort
      const { volunteerNeeded } = req.query
      const { Deadline } = req.query


      let query = {}
      if (search) {
        query = {
          PostTitle: {
            $regex: search,
            $options: 'i'
          }
        }
      }

      if (volunteerNeeded) {

        const needsVolunteer = await NeedVolunteerCollections.find().sort({ volunteersNeeded: -1 }).toArray()
        return res.send(needsVolunteer)
      }

      if (Deadline) {

        const deadline = await NeedVolunteerCollections.find().sort({ deadline: -1 }).toArray()
        return res.send(deadline)
      }
      
      

      if (sort) {
        
        const ascendingPost = await NeedVolunteerCollections.find().sort({ deadline: 1 }).limit(6).toArray()
        return res.send(ascendingPost)
      }


      const data = await NeedVolunteerCollections.find(query).toArray()
      res.send(data)
    })

    app.get('/need-volunteer-posts/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await NeedVolunteerCollections.findOne(query)
      res.send(result)
    })

    app.get('/need-volunteer-my-post',verifyToken, async (req, res) => {
       const email = req.query.email
      const query = { organizerEmail: email }
      const result = await NeedVolunteerCollections.find(query).toArray()
      res.send(result)
    })

    app.put('/need-volunteer-posts/:id', async (req, res) => {
      const id = req.params.id
      const updatedPost = req.body
      const query = { _id: new ObjectId(id) }
      const options = {upsert: true}
      const updatedDoc = {
        $set: {
          thumbnail: updatedPost.thumbnail,
          PostTitle: updatedPost.PostTitle,
          description: updatedPost.description,
          Category: updatedPost.Category,
          Location: updatedPost.Location,
          OrganizerName: updatedPost.OrganizerName,
          organizerEmail: updatedPost.organizerEmail,
          volunteersNeeded: updatedPost.volunteersNeeded,
          deadline: updatedPost.deadline,
        }
      }
      const result = await NeedVolunteerCollections.updateOne(query,updatedDoc,options)
      res.send(result)
    })

    app.delete('/need-volunteer-posts/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await NeedVolunteerCollections.deleteOne(query)
      res.send(result)
    })

    // be a volunteer
    app.post('/be-a-volunteer', async (req, res) => {
      const requestVolunteer = req.body
      const result = await VolunteerCollections.insertOne(requestVolunteer)
     res.send(result)
    })

    app.get('/be-a-volunteer', verifyToken, async (req, res) => {
   
      const email = req.query.email
      const query = { volunteerEmail: email }
      
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

    app.delete('/be-a-volunteer/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await VolunteerCollections.deleteOne(query)
      res.send(result)
    })



  } finally {
    
  }
}
run().catch(console.dir);
