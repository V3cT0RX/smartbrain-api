import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';


const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'newPassword',
      database : 'smart-brain'
    }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());
//1 signin --> post
//2 register  --> post 
//3 profile  --> get
//4 img  --> 

app.get('/',(req,res)=>{
    res.send(database.users)
})

app.post('/signin',(req,res)=>{
    db.select('email','hash')
    .from('login')
    .where('email', '=',req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password , data[0].hash);
        if(isValid){
            return db.select('*')
            .from('users')
            .where('email', '=',req.body.email)
            .then(users => {
                res.json(users[0])
            })
            .catch(err => res.status(400).json('Unable to get User'))
        }else{
            res.statusCode(400).json('Wrong credentials')
        }
    })
    .catch(err => res.status(400).json('Wrong Credentials'))
})

app.post('/register',(req,res)=>{
    const {email,name, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date()
                })
                .then(user => {
                    res.json(user[0]);
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable To Register'));
})

app.get('/profile/:id',(req,res)=>{
    const { id } = req.params;
    // let found = false;
    db.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json('User Not Found')
        }
    }).catch(err => res.status(400).json('Error Getting User'))
    // (user => {
    //     if(user.id === id){
    //         found = true;
    //         return res.json(user);
    //     }
    // })
    // if(!found){
    //     res.status(404).json('User Doesn\'t Exist')
    // }
})

app.put('/image',(req,res)=>{
    const { id } = req.body;
    db('users').where('id', '=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0])
    })
    .catch(err => res.status(400).json('Unable To Get Entries'))
    // let found = false;
    // console.log(id);
    // database.users.forEach(user => {
    //     if(user.id === id){
    //         found = true;
    //         user.entries++
    //         return res.json(user.entries);
    //     }
    // })
    // if(!found){
    //     res.status(404).json('User Doesn\'t Exist')
    // }
})

app.listen(3000, () =>
  console.log('Example app listening on port 3000!'),
);