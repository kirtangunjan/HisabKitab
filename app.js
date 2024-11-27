// all requirements 
const express=require('express');
const app=express()
const cookieParser = require('cookie-parser');
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken")
const userModel=require('./models/user');
const postSchema=require('./models/posts');
// const expenseModel = require('./models/expanse'); // Update with the correct path to your model file
const { sanitizeFilter } = require('mongoose');
const multerconfig=require('./config/multerconfig')
const path=require("path");
const upload = require('./config/multerconfig');
// const { body, validationResult } = require('express-validator');


//for ejs conversions
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.json());
app.use(cookieParser())




//home ,profile
app.get("/",function(req,res){
    res.render("index")
})

app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        // Retrieve the user based on the logged-in user's email
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Retrieve posts for the user
        const posts = await postSchema.find({ user: user._id });

        // Render the profile page with user and posts data
        res.render("profile", { user, posts });
    } catch (err) {
        console.error("Error fetching user profile or posts:", err);
        res.status(500).send("Server error");
    }
});

app.get("/editprofile/:userid",isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({_id:req.params.userid})
    res.render("editprofile",{user});
})

app.post("/update/:userid",isLoggedIn,async (req,res)=>{
    let {name,username,email,age}=req.body;
    let user=await userModel.findOneAndUpdate({_id:req.params.userid},{name,username,email,age},{new:true})
    res.redirect("/profile");
})

app.get("/deleteprofile/:userid", isLoggedIn, async (req, res) => {
    try {
        // Find the user by ID
        let user = await userModel.findOne({ _id: req.params.userid });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Delete the user by ID
        await userModel.findByIdAndDelete(req.params.userid);

        // Redirect to the login page after deletion
        res.redirect('/login');
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("An error occurred while deleting the user.");
    }
});

//routes for hisab 
app.get("/addhisab",isLoggedIn,function(req,res){
    res.render("addhisab")
})

app.get("/viewHisab", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) return res.status(404).send("User not found");

        const posts = await postSchema.find({ user: user._id });

        // Prepare months and initialize income/expense arrays
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const incomeData = new Array(12).fill(0);
        const expenseData = new Array(12).fill(0);

        // Iterate over posts and populate income/expense data
        posts.forEach(post => {
            const month = post.date.getMonth();  // Get month index (0-11)
            if (post.category === 'Income') {
                incomeData[month] += post.amount;
            } else if (post.category === 'Expense') {
                expenseData[month] += post.amount;
            }
        });

        // Log data to ensure it's being calculated properly
        console.log('Income Data:', incomeData);
        console.log('Expense Data:', expenseData);
        console.log('Months:', months);

        // Pass data to EJS
        res.render("viewHisab", { posts, incomeData, expenseData, months });
    } catch (err) {
        console.error("Error fetching Hisab:", err);
        res.status(500).send("Error fetching Hisab");
    }
});

app.post("/add-Hisab", isLoggedIn, async (req, res) => {
    try {
        // Destructure the request body
        const { category, amount, description, tags } = req.body;

        // Get the logged-in user
        const user = await userModel.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Create a new Hisab (post)
        const newPost = await postSchema.create({
            user: user._id,
            category,
            amount,
            description,
            tags: tags.split(",")  // If tags are provided as comma-separated values
        });

        // Optionally, add the post to the user's posts array (if this is part of your design)
        user.posts.push(newPost._id);
        await user.save();

        // Redirect or send a response
        res.redirect("/viewhisab");  // Or send a success response
    } catch (err) {
        console.error("Error adding Hisab:", err);
        res.status(500).send("Error adding Hisab");
    }
});

app.get('/delete-hisab/:id', async (req, res) => {
    try {
        // Find the post by its ID and delete it
        const postId = req.params.id;
        await postSchema.findByIdAndDelete(postId);
        
        // Redirect to the view page after deletion
        res.redirect('/viewhisab'); // Redirect back to your Hisab list or view page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting the entry');
    }
});






// Edit Hisab page route
app.get('/edit-hisab/:id', async (req, res) => {
    try {
        const postId = req.params.id; // Get the id from the URL

        // Find the post by its ID
        const post = await postSchema.findById(postId);

        // If the post is not found, send a 404 response
        if (!post) {
            return res.status(404).send('Hisab entry not found');
        }

        // Render the edit page with the current post data
        res.render('editHisab', { post });  // Pass the post data to the view
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching the entry');
    }
});

// Update Hisab entry
app.post('/update-hisab/:id', async (req, res) => {
    try {
        const postId = req.params.id;

        // Collect the updated data from the form
        const updatedPost = {
            date: req.body.date,
            category: req.body.category,
            amount: req.body.amount,
            description: req.body.description
        };

        // Find and update the post by its ID
        const post = await postSchema.findByIdAndUpdate(postId, updatedPost, { new: true });

        // If the post doesn't exist, send a 404 response
        if (!post) {
            return res.status(404).send('Hisab entry not found');
        }

        // Redirect to the view page after the update
        res.redirect('/viewhisab');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating the entry');
    }
});




//multer
app.get("/profile/upload",isLoggedIn,(req,res)=>{
    res.render("profileupload");
})

app.post("/upload",isLoggedIn,upload.single("image"),async (req,res)=>{
   let user=await userModel.findOne({email:req.user.email})
   user.profilepic=req.file.filename;
   await user.save()
   res.redirect("/profile")  

});



//autherisation and authentication routes   
app.get("/register",function(req,res){
    res.render("register")
})


app.post("/register", async function(req,res){
    let {email, password,username,name,age}=req.body
    let user=await userModel.findOne({email});
    if(user) return res.status(500).send("User already register");

    bcrypt.genSalt(10,(err,salt)=>(
        bcrypt.hash(password,salt,async (err,hash)=>{
          let user= await userModel.create({
                username,
                name,
                age,
                email,
                password:hash
            });
            let token=jwt.sign({email:email,userid:user._id},"shhhhhhhhhhhhhhhh");
            res.cookie("token",token)
            res.render("profile",{user})
        })
    ))
    
})


app.get("/login",(req,res)=>{
    res.render("login")
})

app.post("/login", async function(req,res){
    let {email, password}=req.body
    let user=await userModel.findOne({email});
    if(!user) return res.status(500).send("something went wrong");

    bcrypt.compare(password,user.password,function(err,result){
        if(result){
            let token=jwt.sign({email:email,userid:user._id},"shhhhhhhhhhhhhhhh");
            res.cookie("token",token)
            res.status(200).redirect("/profile")
        } 
        else res.redirect("/login");
    })
    
})


app.get('/logout',(req,res)=>{
    res.cookie("token","")
    res.redirect("/login")
})

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/login"); // Redirect if not logged in
    }
    try {
        const decoded = jwt.verify(token, "shhhhhhhhhhhhhhhh"); // Verify token
        req.user = decoded; // Store user data in req.user
        next(); // Proceed to next middleware
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.redirect("/login"); // Redirect if token verification fails
    }
}








app.listen(3000);
