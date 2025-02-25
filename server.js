const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require("./db/conn");


const User = require('./models/User'); 
const Timer = require('./models/Timer');
const conn = require('./db/conn'); 



const app = express();
const port = process.env.PORT || 5000;
const secretKey = 'secret-key'; 

// app.use(express.static('build'))

 app.use(bodyParser.json());
 //const allowedOrigins = ['https://react-reminder-app-alpha.vercel.app'];
 app.use(cors({
     origin: "*"
}));


const users = [
    {
        id: 1,
        username: 'user1',
        password: '$2b$10$6bNK3lwYd2MhQQ5gWszNLef.ZRG6MWuR0DMY8SxHTskcaEUs/JyKS', // hashed password: 'password123'
    },
];

// Route to receive and store the reminderTimeInSeconds
app.post('/saveReminderTime', async (req, res) => {
    const { reminderTimeInSeconds } = req.body;

    if (reminderTimeInSeconds !== undefined) {
        // Create a new Timer entry with the reminder field
        const newTimer = new Timer({ reminder: reminderTimeInSeconds });

        try {
            // Save the newTimer to the database
            await newTimer.save();
            res.status(201).json(newTimer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to save reminder time' });
        }
    } else {
        res.status(400).json({ error: 'Invalid reminderTimeInSeconds value' });
    }
});


// signup endpoint
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const newUser = new User({ username, password });

        newUser.password = bcrypt.hashSync(password, 10);
        // console.log('New User Data:', newUser);


        await newUser.save();

        return res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {

        const user = await User.findOne({ username });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// protected route
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'You have access to this protected route!', user: req.user });
});



// middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = user;
        next();
    });
}


// start the server

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
