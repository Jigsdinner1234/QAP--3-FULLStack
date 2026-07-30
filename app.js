const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
        secret: "recipe-secret-key",
        resave: false,
        saveUninitialized: false
    })
);


// In-memory storage

let users = [];

let recipes = [];


// Default admin account

(async () => {

    const passwordHash = await bcrypt.hash("admin12345", 10);

    users.push({
        id: 1,
        username: "admin",
        email: "admin@email.com",
        password: passwordHash,
        role: "admin"
    });

})();



// Middleware
const { requireLogin } = require("./middleware/auth");

// HOME PAGE

app.get("/", (req,res)=>{

    res.render("home",{
        user:req.session.user
    });

});



// REGISTER PAGE

app.get("/register",(req,res)=>{

    res.render("register",{error:null});

});


// REGISTER

app.post("/register",async(req,res)=>{

    const {username,email,password}=req.body;


    if(password.length < 8){

        return res.render("register",{
            error:"Password must be at least 8 characters"
        });

    }


    const exists = users.find(
        u=>u.email===email || u.username===username
    );


    if(exists){

        return res.render("register",{
            error:"Username or email already exists"
        });

    }


    const hash = await bcrypt.hash(password,10);


    users.push({

        id:Date.now(),
        username,
        email,
        password:hash,
        role:"user"

    });


    res.redirect("/login");

});



// LOGIN PAGE

app.get("/login",(req,res)=>{

    res.render("login",{error:null});

});



// LOGIN

app.post("/login",async(req,res)=>{


    const {email,password}=req.body;


    const user = users.find(
        u=>u.email===email
    );


    if(!user){

        return res.render("login",{
            error:"Invalid email or password"
        });

    }


    const match = await bcrypt.compare(
        password,
        user.password
    );


    if(!match){

        return res.render("login",{
            error:"Invalid email or password"
        });

    }


    req.session.user={

        id:user.id,
        username:user.username,
        role:user.role

    };


    res.redirect("/recipes");

});



// RECIPES PAGE

app.get("/recipes",requireLogin,(req,res)=>{


    let userRecipes;


    if(req.session.user.role==="admin"){

        userRecipes=recipes;

    }
    else{

        userRecipes=recipes.filter(
            r=>r.userId===req.session.user.id
        );

    }


    res.render("recipes",{

        recipes:userRecipes,
        user:req.session.user

    });


});



// CREATE RECIPE PAGE

app.get("/recipes/create",requireLogin,(req,res)=>{


    res.render("create-recipe",{
        error:null
    });


});



// CREATE RECIPE

app.post("/recipes/create",requireLogin,(req,res)=>{


    const {
        name,
        ingredients,
        instructions
    }=req.body;



    if(!name || !ingredients || !instructions){

        return res.render(
            "create-recipe",
            {
                error:"All fields are required"
            }
        );

    }



    const recipe={

        id:Date.now(),
        name,
        ingredients,
        instructions,
        userId:req.session.user.id,
        username:req.session.user.username

    };


    recipes.push(recipe);



    res.redirect(`/recipes/${recipe.id}`);


});




// RECIPE DETAILS

app.get("/recipes/:id",requireLogin,(req,res)=>{


    const recipe = recipes.find(
        r=>r.id==req.params.id
    );


    if(!recipe){

        return res.render("error",{
            message:"Recipe not found"
        });

    }



    const allowed =
        recipe.userId===req.session.user.id ||
        req.session.user.role==="admin";


    if(!allowed){

        return res.render("error",{
            message:"Access denied"
        });

    }



    res.render("recipe-detail",{

        recipe,
        user:req.session.user

    });


});





// DELETE RECIPE

app.post("/recipes/delete/:id",requireLogin,(req,res)=>{


    const recipe = recipes.find(
        r=>r.id==req.params.id
    );


    if(!recipe){

        return res.redirect("/recipes");

    }



    if(
        recipe.userId !== req.session.user.id &&
        req.session.user.role!=="admin"
    ){

        return res.render("error",{
            message:"You cannot delete this recipe"
        });

    }



    recipes = recipes.filter(
        r=>r.id!=req.params.id
    );


    res.redirect("/recipes");


});





// LOGOUT

app.get("/logout",(req,res)=>{


    req.session.destroy(()=>{

        res.redirect("/");

    });


});





app.listen(3000,()=>{

    console.log("Server running on  http://localhost:3000");

});
